const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { providerRoutes } = require('./routes/providerRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes FIRST (before static files)
app.use('/api/providers', providerRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 🔧 FIX: Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// 🔧 FIX: Catch-all handler for React Router (MUST be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Full-stack app running on port ${PORT}`);
});
