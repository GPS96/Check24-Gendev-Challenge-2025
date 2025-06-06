const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { providerRoutes } = require('./routes/providerRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 🔧 CORS for separate frontend deployment
app.use(cors({
  origin: [
    'http://localhost:3000',
    // Add your frontend Railway URL here after deployment
    'https://frontend-production-*.up.railway.app'
  ],
  credentials: true
}));

app.use(express.json());

// API routes only (no static file serving)
app.use('/api/providers', providerRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Backend server running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
});
