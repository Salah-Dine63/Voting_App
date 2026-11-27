const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const status = error.status || (error.code === '23505' ? 409 : 500);
    if (status >= 500) {
        console.error(error);
    }

    return res.status(status).json({
        message: status >= 500
            ? 'Internal server error'
            : error.code === '23505'
                ? 'A record with these values already exists'
                : error.message
    });
};

module.exports = { errorHandler };
