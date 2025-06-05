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

// API routes
app.use('/api/providers', providerRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 🔧 NEW: Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// 🔧 NEW: Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
