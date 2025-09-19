import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { weatherRouter } from './routes/weather';
import { aiRouter } from './routes/ai';
import { dataRouter } from './routes/data';
import fertilizerRoutes from './routes/fertilizer';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Environment variables loaded successfully

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/weather', weatherRouter);
app.use('/api/ai', aiRouter);
app.use('/api/data', dataRouter);
app.use('/api/agent', fertilizerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Bhoomi AI Advisory Backend'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Bhoomi AI Advisory Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
