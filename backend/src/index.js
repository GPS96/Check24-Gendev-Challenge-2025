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

//Use path.resolve() instead of __dirname
const resolvedDirectory = path.resolve();

// API routes
app.use('/api/providers', providerRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// WORKING STATIC FILE SERVING
app.use(express.static(path.join(resolvedDirectory, '/frontend/build')));

//  WORKING CATCH-ALL
app.get('*', (req, res) => {
  res.sendFile(path.join(resolvedDirectory, '/frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
