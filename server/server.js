// Import required packages
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

// Initialize Express app
const app = express();

// --- Middleware ---
// Helmet for basic security headers
app.use(helmet());
// CORS to allow requests from your frontend
app.use(cors());
// Middleware to parse incoming JSON data
app.use(express.json());
// route connections 
app.use('/api/auth', require('./routes/auth.routes.js'));
app.use('/api/scan', require('./routes/scan.routes.js'));
app.use('/api', require('./routes/incidents.routes.js'));
// const clientProfileRoutes = require('./routes/clientProfile.routes.js');
//app.use('/api', clientProfileRoutes);
//app.use('/api/scan', require('./routes/scan.routes.js'));
app.use('/api/profile', require('./routes/profile.routes.js'));

// simple health check
app.get('/health', (_req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
}));


// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully.');
    // Start the server only after the DB connection is successful
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// --- Basic Route for Testing ---
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Vigil.ai API!' });
});

