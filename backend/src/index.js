const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { providerRoutes } = require('./routes/providerRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// 🔧 CRITICAL FIX: Serve static files (based on search result #6)
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// API routes
app.use('/api/providers', providerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 🔧 CATCH-ALL for React Router (MUST be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
