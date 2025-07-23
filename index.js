const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require("dotenv");
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const orgRoutes = require('./routes/organizations');
const meetingRoutes = require('./routes/meetings');

// Initialize Express app
const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple auth stub middleware
app.use((req, res, next) => {
  const orgId = req.headers['x-org-id'] || '1'; // Default to org '1' if not provided
  req.orgId = orgId;
  // In a real app, you'd have a user ID from a validated JWT
  req.userId = orgId === '1' ? '1' : '3'; // Mock user based on org
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/meetings', meetingRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🏢 Default Organization ID: 1 (TechCorp Solutions)`);
  console.log(`Switch org by setting 'x-org-id' header to '2' (InnovateNow Inc)`);
});