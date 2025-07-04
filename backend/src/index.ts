import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { providerRoutes } from './routes/providerRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/providers', providerRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
