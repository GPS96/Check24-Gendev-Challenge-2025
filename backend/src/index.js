const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { providerRoutes } = require('./routes/providerRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 🔧 CORS configuration for the deployed frontend
const corsOptions = {
  origin: [
    'http://localhost:3000',  // For local development
    'https://zucchini-optimism-production.up.railway.app'
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Access-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  credentials: true
};

// Apply CORS with proper options
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // Handle preflight requests

app.use(express.json());

// API routes
app.use('/api/providers', providerRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Backend server running',
    timestamp: new Date().toISOString(),
    allowedOrigins: corsOptions.origin
  });
});

app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`Allowing CORS from: ${corsOptions.origin.join(', ')}`);
});
