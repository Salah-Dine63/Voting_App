
const jwt = require('jsonwebtoken');
const pool = require('../databaseConfig/databaseConnection');

const getUserFromToken = async (token) => {
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }

    const result = await pool.query(
        `SELECT id, first_name, last_name, email, role, created_at
         FROM users
         WHERE id = $1`,
        [decoded.id]
    );

    return result.rows[0] || null;
};

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const user = await getUserFromToken(authHeader.slice(7));
        if (!user) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
};

const optionalProtect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    try {
        const user = await getUserFromToken(authHeader.slice(7));
        if (!user) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = { protect, optionalProtect };
