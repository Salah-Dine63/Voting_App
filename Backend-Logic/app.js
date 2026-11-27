
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { clientOrigins } = require('./config/clientOrigins');

const authRoutes = require('./routes/authRoutes');
const pollRoutes = require('./routes/pollRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// CORS configuration
app.use(cors({
  origin: clientOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON requests
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Backend API is running!'
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

app.use(errorHandler);

module.exports = app;
