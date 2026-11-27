const pool = require('../databaseConfig/databaseConnection');

const pollFields = `
    p.id,
    p.public_id,
    p.title AS question,
    p.description,
    p.status,
    p.created_by,
    p.starts_at,
    p.ends_at,
    p.created_at,
    p.updated_at,
    u.first_name AS creator_first_name,
    u.last_name AS creator_last_name
`;

const createPoll = async (client, { question, description, creatorId, endsAt, publicId }) => {
    const result = await client.query(
        `INSERT INTO polls (title, description, status, created_by, ends_at, public_id)
         VALUES ($1, $2, 'draft', $3, $4, $5)
         RETURNING id, public_id, title AS question, description, status,
                   created_by, ends_at, created_at, updated_at`,
        [question, description, creatorId, endsAt, publicId]
    );
    return result.rows[0];
};

const createOptions = async (client, pollId, options) => {
    for (const option of options) {
        await client.query(
            'INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2)',
            [pollId, option]
        );
    }
};

const getOptionsForTransaction = async (client, pollId) => {
    const result = await client.query(
        'SELECT id, option_text FROM poll_options WHERE poll_id = $1 ORDER BY id',
        [pollId]
    );
    return result.rows;
};

const findByPublicId = async (queryable, publicId, lock = false) => {
    const result = await queryable.query(
        `SELECT ${pollFields}
         FROM polls p
         JOIN users u ON u.id = p.created_by
         WHERE p.public_id = $1
         ${lock ? 'FOR UPDATE OF p' : ''}`,
        [publicId]
    );
    return result.rows[0] || null;
};

const getOptions = async (pollId) => {
    const result = await pool.query(
        'SELECT id, option_text FROM poll_options WHERE poll_id = $1 ORDER BY id',
        [pollId]
    );
    return result.rows;
};

const listActive = async () => {
    const result = await pool.query(
        `SELECT ${pollFields},
                (SELECT COUNT(*)::int FROM votes v WHERE v.poll_id = p.id) AS vote_count
         FROM polls p
         JOIN users u ON u.id = p.created_by
         WHERE p.status = 'active'
           AND (p.ends_at IS NULL OR p.ends_at > NOW())
         ORDER BY p.created_at DESC
         LIMIT 100`
    );
    return result.rows;
};

const listMine = async (creatorId, limit = 100) => {
    const result = await pool.query(
        `SELECT ${pollFields},
                (SELECT COUNT(*)::int FROM votes v WHERE v.poll_id = p.id) AS vote_count
         FROM polls p
         JOIN users u ON u.id = p.created_by
         WHERE p.created_by = $1
         ORDER BY p.created_at DESC
         LIMIT $2`,
        [creatorId, limit]
    );
    return result.rows;
};

const listRecent = async (creatorId, limit = 5) => {
    const result = await pool.query(
        `SELECT p.public_id, p.title AS question, p.status, p.created_at,
                (SELECT COUNT(*)::int FROM votes v WHERE v.poll_id = p.id) AS vote_count
         FROM polls p
         WHERE p.created_by = $1
         ORDER BY p.created_at DESC
         LIMIT $2`,
        [creatorId, limit]
    );
    return result.rows;
};

const updatePoll = async (client, pollId, { question, description, endsAt }) => {
    const result = await client.query(
        `UPDATE polls
         SET title = $2, description = $3, ends_at = $4, updated_at = NOW()
         WHERE id = $1
         RETURNING id, public_id, title AS question, description, status,
                   created_by, ends_at, created_at, updated_at`,
        [pollId, question, description, endsAt]
    );
    return result.rows[0];
};

const deleteOptions = async (client, pollId) => {
    await client.query('DELETE FROM poll_options WHERE poll_id = $1', [pollId]);
};

const setStatus = async (client, pollId, status) => {
    const result = await client.query(
        `UPDATE polls SET status = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING id, public_id, status, ends_at`,
        [pollId, status]
    );
    return result.rows[0];
};

const deletePoll = async (client, pollId) => {
    await client.query('DELETE FROM polls WHERE id = $1', [pollId]);
};

const hasVoted = async (pollId, userId) => {
    if (!userId) {
        return false;
    }
    const result = await pool.query(
        'SELECT EXISTS (SELECT 1 FROM votes WHERE poll_id = $1 AND user_id = $2) AS voted',
        [pollId, userId]
    );
    return result.rows[0].voted;
};

const getResults = async (poll) => {
    const result = await pool.query(
        `SELECT o.id, o.option_text,
                COUNT(v.id)::int AS votes
         FROM poll_options o
         LEFT JOIN votes v ON v.option_id = o.id AND v.poll_id = o.poll_id
         WHERE o.poll_id = $1
         GROUP BY o.id, o.option_text
         ORDER BY o.id`,
        [poll.id]
    );
    const totalVotes = result.rows.reduce((total, option) => total + option.votes, 0);

    return {
        poll: {
            public_id: poll.public_id,
            question: poll.question,
            status: poll.status,
            ends_at: poll.ends_at
        },
        totalVotes,
        options: result.rows.map((option) => ({
            ...option,
            percentage: totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 1000) / 10
        }))
    };
};

const getDashboardSummary = async (creatorId) => {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS total_polls,
                COUNT(*) FILTER (
                    WHERE p.status = 'active'
                      AND (p.ends_at IS NULL OR p.ends_at > NOW())
                )::int AS active_polls,
                COUNT(*) FILTER (WHERE p.status = 'closed')::int AS closed_polls,
                COALESCE(SUM((SELECT COUNT(*) FROM votes v WHERE v.poll_id = p.id)), 0)::int
                    AS total_votes_received
         FROM polls p
         WHERE p.created_by = $1`,
        [creatorId]
    );
    return result.rows[0];
};

const getRecentActivity = async (userId, limit = 5) => {
    const result = await pool.query(
        `SELECT p.public_id, p.title AS question, v.voted_at,
                u.first_name AS creator_first_name, u.last_name AS creator_last_name,
                o.option_text
         FROM votes v
         JOIN polls p ON p.id = v.poll_id
         JOIN users u ON u.id = p.created_by
         JOIN poll_options o ON o.id = v.option_id
         WHERE v.user_id = $1
         ORDER BY v.voted_at DESC
         LIMIT $2`,
        [userId, limit]
    );
    return result.rows;
};

const closeExpiredPolls = async () => {
    const result = await pool.query(
        `UPDATE polls
         SET status = 'closed', updated_at = NOW()
         WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at <= NOW()
         RETURNING id, public_id, title AS question, status, ends_at`
    );
    return result.rows;
};

module.exports = {
    pool,
    createPoll,
    createOptions,
    getOptionsForTransaction,
    findByPublicId,
    getOptions,
    listActive,
    listMine,
    listRecent,
    updatePoll,
    deleteOptions,
    setStatus,
    deletePoll,
    hasVoted,
    getResults,
    getDashboardSummary,
    getRecentActivity,
    closeExpiredPolls
};
