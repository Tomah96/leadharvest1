const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Import routes
const leadRoutes = require('./src/routes/leadRoutes');
const gmailRoutes = require('./src/routes/gmailRoutes');
const conversationRoutes = require('./src/routes/conversationRoutes');
const processingRoutes = require('./src/routes/processingRoutes');
const testRoutes = require('./src/routes/testRoutes');
const templateRoutes = require('./src/routes/templateRoutes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - allow both port 3000 and 3002
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003'
    ];
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.FRONTEND_URL === origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Request logging
app.use(morgan('combined'));

// Response compression
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/leads', leadRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api', conversationRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api', testRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;