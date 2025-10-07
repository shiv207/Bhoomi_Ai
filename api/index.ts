import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverlessExpress from '@vendia/serverless-express';
import app from '../src/server/app';

// Create serverless handler once (cached across warm invocations)
const handler = serverlessExpress({ app });

export default function vercelHandler(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}


