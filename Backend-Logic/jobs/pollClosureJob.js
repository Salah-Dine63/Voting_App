const cron = require('node-cron');
const pollRepository = require('../repositories/pollRepository');
const { emitToPoll } = require('../services/socketHub');

const startPollClosureJob = async (io) => {
    const { setSocketServer } = require('../services/socketHub');
    setSocketServer(io);

    try {
        await pollRepository.pool.query('SELECT public_id FROM polls LIMIT 0');
    } catch (error) {
        if (error.code === '42703') {
            console.error(
                'Poll closure job was not started. Apply Database-Logic/migrations/001_polling_platform.sql first:',
                error
            );
            return null;
        }
        console.error('Poll closure job readiness check failed; it will retry on schedule:', error);
    }

    return cron.schedule('* * * * *', async () => {
        try {
            const closedPolls = await pollRepository.closeExpiredPolls();
            for (const poll of closedPolls) {
                emitToPoll(poll.public_id, 'poll:closed', { public_id: poll.public_id });
                const persistedPoll = await pollRepository.findByPublicId(
                    pollRepository.pool,
                    poll.public_id
                );
                emitToPoll(
                    poll.public_id,
                    'poll:results-updated',
                    await pollRepository.getResults(persistedPoll)
                );
            }
        } catch (error) {
            console.error('Failed to close expired polls:', error);
        }
    });
};

module.exports = { startPollClosureJob };
