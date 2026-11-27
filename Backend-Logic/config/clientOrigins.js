const configuredOrigins = process.env.CLIENT_URL;

const clientOrigins = configuredOrigins
    ? configuredOrigins.split(',').map((origin) => origin.trim().replace(/\/+$/, '')).filter(Boolean)
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

module.exports = { clientOrigins };
