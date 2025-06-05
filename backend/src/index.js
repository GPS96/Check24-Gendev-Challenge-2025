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

// 🔧 FIX: Serve static files FIRST (based on search result #2)
const buildPath = path.join(__dirname, '../../frontend/build');
app.use(express.static(buildPath));

// API routes AFTER static files
app.use('/api/providers', providerRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    buildPath: buildPath // Debug info
  });
});

// 🔧 CRITICAL: Catch-all for React Router (MUST be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Full-stack app running on port ${PORT}`);
  console.log(`Serving static files from: ${buildPath}`);
});
