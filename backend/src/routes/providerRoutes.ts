import { Router, Request, Response } from 'express';
import { ProviderManager } from '../services/ProviderManager';

const router: Router = Router();
const providerManager = new ProviderManager();

router.get('/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'Provider routes working!',
    timestamp: new Date().toISOString()
  });
});

router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { street, houseNumber, city, postalCode } = req.body;

    if (!street || !houseNumber || !city || !postalCode) {
      return res.status(400).json({
        error: 'Missing required fields: street, houseNumber, city, postalCode'
      });
    }

    const query = { street, houseNumber, city, postalCode };
    
    // Use real ProviderManager instead of mock
    const result = await providerManager.compareProviders(query);

    res.json(result);
  } catch (error: any) {
    console.error('Provider comparison error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export { router as providerRoutes };
