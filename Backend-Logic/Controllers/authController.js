
const pool = require('../databaseConfig/databaseConnection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const createToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        }
    );
};

// ========================
// REGISTER
// ========================
const register = async (req, res, next) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (
            typeof first_name !== 'string' ||
            typeof last_name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                message: 'Invalid input'
            });
        }

        const firstName = first_name.trim();
        const lastName = last_name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!firstName || !lastName) {
            return res.status(400).json({
                message: 'First name and last name are required'
            });
        }

        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                message: 'Password must contain between 8 and 72 characters'
            });
        }

        // Check existing email
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE LOWER(email) = $1',
            [cleanEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Insert user
        const result = await pool.query(
            `INSERT INTO users
                (first_name, last_name, email, password_hash, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, first_name, last_name, email, role, created_at`,
            [firstName, lastName, cleanEmail, passwordHash, 'user']
        );

        const user = result.rows[0];
        const token = createToken(user);

        return res.status(201).json({
            message: 'Account created successfully',
            token,
            user
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        next(error);
    }
};

// ========================
// LOGIN
// ========================
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find user
        const result = await pool.query(
            `SELECT id, first_name, last_name, email,
                    password_hash, role, created_at
             FROM users
             WHERE LOWER(email) = $1`,
            [cleanEmail]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Compare password
        const passwordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordValid) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const safeUser = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            created_at: user.created_at
        };

        const token = createToken(safeUser);

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: safeUser
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login
};
