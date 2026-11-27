const pollRepository = require('../repositories/pollRepository');
const { setSocketServer } = require('../services/socketHub');

const registerSocketHandlers = (io) => {
    setSocketServer(io);

    io.on('connection', (socket) => {
        socket.on('poll:join', async (publicId) => {
            if (typeof publicId !== 'string') {
                return;
            }
            try {
                const poll = await pollRepository.findByPublicId(pollRepository.pool, publicId);
                if (!poll || poll.status !== 'active' ||
                    (poll.ends_at && new Date(poll.ends_at) <= new Date())) {
                    return;
                }
                await socket.join(publicId);
            } catch (error) {
                console.error('Unable to join poll room:', error);
            }
        });

        socket.on('poll:leave', (publicId) => {
            if (typeof publicId === 'string') {
                socket.leave(publicId);
            }
        });
    });
};

module.exports = { registerSocketHandlers };
