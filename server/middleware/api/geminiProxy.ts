import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const proxyBodySchema = z.object({
  model: z.string().min(1, 'Model name is required'),
  contents: z.union([z.array(z.any()), z.any()]).optional(),
  config: z.any().optional(),
  stream: z.boolean().optional(),
});

export function validateGeminiProxyRequest(req: Request, res: Response, next: NextFunction) {
  // 1. Backend Authentication Key Check (Key Injection validation)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[GeminiProxy] GEMINI_API_KEY is not configured on the server environment.');
    return res.status(550).json({
      error: 'GEMINI_API_KEY is missing or invalid on the server configuration. Please check your system variables.'
    });
  }

  // 2. Validate Request Body payload
  if (req.method === 'POST') {
    const parseResult = proxyBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request layout or parameters',
        details: parseResult.error.format()
      });
    }
  }

  // 3. Authenticated & Valided, proceed to request route handler/controller
  next();
}
