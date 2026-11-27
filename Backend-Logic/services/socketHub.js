let io;

const setSocketServer = (server) => {
    io = server;
};

const emitToPoll = (publicId, event, payload) => {
    if (io) {
        io.to(publicId).emit(event, payload);
    }
};

module.exports = { setSocketServer, emitToPoll };
