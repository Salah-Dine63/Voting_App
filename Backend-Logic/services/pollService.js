const { randomUUID } = require('crypto');
const repository = require('../repositories/pollRepository');
const { AppError } = require('../utils/appError');
const { emitToPoll } = require('./socketHub');

const normalizePollInput = (input = {}) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new AppError('Poll details must be an object');
    }
    const { question, description, options, ends_at: endsAt } = input;
    if (typeof question !== 'string' || !question.trim() || question.trim().length > 255) {
        throw new AppError('Question is required and must be at most 255 characters');
    }
    if (description != null && (typeof description !== 'string' || description.length > 5000)) {
        throw new AppError('Description must be at most 5000 characters');
    }
    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
        throw new AppError('A poll must have between 2 and 6 options');
    }
    const cleanOptions = options.map((option) => {
        if (typeof option !== 'string' || !option.trim() || option.trim().length > 255) {
            throw new AppError('Each option must be non-empty and at most 255 characters');
        }
        return option.trim();
    });
    if (new Set(cleanOptions.map((option) => option.toLowerCase())).size !== cleanOptions.length) {
        throw new AppError('Poll options must be unique');
    }

    let normalizedEndsAt = null;
    if (endsAt != null && endsAt !== '') {
        const parsedDate = new Date(endsAt);
        if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
            throw new AppError('Closing date must be a valid future date');
        }
        normalizedEndsAt = parsedDate.toISOString();
    }

    return {
        question: question.trim(),
        description: description && description.trim() ? description.trim() : null,
        options: cleanOptions,
        endsAt: normalizedEndsAt
    };
};

const withTransaction = async (operation) => {
    const client = await repository.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await operation(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Failed to roll back poll transaction:', rollbackError);
        }
        throw error;
    } finally {
        client.release();
    }
};

const assertPoll = (poll) => {
    if (!poll) {
        throw new AppError('Poll not found', 404);
    }
    return poll;
};

const assertOwner = (poll, userId) => {
    if (String(poll.created_by) !== String(userId)) {
        throw new AppError('You are not allowed to manage this poll', 403);
    }
};

const create = async (userId, input) => {
    const data = normalizePollInput(input);
    return withTransaction(async (client) => {
        const poll = await repository.createPoll(client, {
            ...data,
            creatorId: userId,
            publicId: randomUUID()
        });
        await repository.createOptions(client, poll.id, data.options);
        return { ...poll, options: await repository.getOptionsForTransaction(client, poll.id) };
    });
};

const getByPublicId = async (publicId, userId) => {
    const poll = assertPoll(await repository.findByPublicId(repository.pool, publicId));
    if (poll.status === 'draft' &&
        (!userId || String(poll.created_by) !== String(userId))) {
        throw new AppError('Poll not found', 404);
    }
    const [options, voted] = await Promise.all([
        repository.getOptions(poll.id),
        repository.hasVoted(poll.id, userId)
    ]);
    return { ...poll, options, has_voted: voted };
};

const update = async (publicId, userId, input) => {
    const data = normalizePollInput(input);
    return withTransaction(async (client) => {
        const poll = assertPoll(await repository.findByPublicId(client, publicId, true));
        assertOwner(poll, userId);
        if (poll.status !== 'draft') {
            throw new AppError('Only draft polls can be edited', 409);
        }
        const updated = await repository.updatePoll(client, poll.id, data);
        await repository.deleteOptions(client, poll.id);
        await repository.createOptions(client, poll.id, data.options);
        return { ...updated, options: await repository.getOptionsForTransaction(client, poll.id) };
    });
};

const changeStatus = async (publicId, userId, nextStatus) => {
    const result = await withTransaction(async (client) => {
        const poll = assertPoll(await repository.findByPublicId(client, publicId, true));
        assertOwner(poll, userId);
        if (nextStatus === 'active' && poll.status !== 'draft') {
            throw new AppError('Only draft polls can be published', 409);
        }
        if (nextStatus === 'active' && poll.ends_at && new Date(poll.ends_at) <= new Date()) {
            throw new AppError('An expired poll cannot be published', 409);
        }
        if (nextStatus === 'closed' && poll.status !== 'active') {
            throw new AppError('Only active polls can be closed manually', 409);
        }
        return repository.setStatus(client, poll.id, nextStatus);
    });

    if (nextStatus === 'closed') {
        const poll = await repository.findByPublicId(repository.pool, publicId);
        emitToPoll(publicId, 'poll:closed', { public_id: publicId });
        emitToPoll(publicId, 'poll:results-updated', await repository.getResults(poll));
    }
    return result;
};

const removeDraft = async (publicId, userId) => withTransaction(async (client) => {
    const poll = assertPoll(await repository.findByPublicId(client, publicId, true));
    assertOwner(poll, userId);
    if (poll.status !== 'draft') {
        throw new AppError('Only draft polls can be deleted', 409);
    }
    await repository.deletePoll(client, poll.id);
});

const getResults = async (publicId) => {
    const poll = assertPoll(await repository.findByPublicId(repository.pool, publicId));
    if (poll.status === 'draft') {
        throw new AppError('Results are not available for a draft poll', 409);
    }
    return repository.getResults(poll);
};

const submitVote = async (publicId, userId, optionId) => {
    if (!Number.isSafeInteger(Number(optionId)) || Number(optionId) <= 0) {
        throw new AppError('A valid option is required');
    }

    const result = await withTransaction(async (client) => {
        const poll = assertPoll(await repository.findByPublicId(client, publicId, true));
        if (poll.status !== 'active' || (poll.ends_at && new Date(poll.ends_at) <= new Date())) {
            throw new AppError('This poll is closed', 409);
        }
        const option = await client.query(
            'SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2',
            [Number(optionId), poll.id]
        );
        if (option.rows.length === 0) {
            throw new AppError('The selected option does not belong to this poll', 400);
        }
        const existingVote = await client.query(
            'SELECT 1 FROM votes WHERE poll_id = $1 AND user_id = $2',
            [poll.id, userId]
        );
        if (existingVote.rows.length > 0) {
            throw new AppError('You have already voted in this poll', 409);
        }
        await client.query(
            'INSERT INTO votes (user_id, poll_id, option_id) VALUES ($1, $2, $3)',
            [userId, poll.id, Number(optionId)]
        );
        return { poll };
    });

    const results = await repository.getResults(result.poll);
    emitToPoll(publicId, 'poll:results-updated', results);
    return results;
};

const listActive = () => repository.listActive();
const listMine = (userId) => repository.listMine(userId);

module.exports = {
    normalizePollInput,
    create,
    getByPublicId,
    update,
    changeStatus,
    removeDraft,
    getResults,
    submitVote,
    listActive,
    listMine
};
