import { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

export function initializeFirebase() {
  if (getApps().length > 0) {
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(serviceAccount)
      });
      return;
    } catch (err) {
      console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', err);
    }
  }

  // Fallback: load projectId from firebase-applet-config.json or use fallback ID
  let projectId = 'project-3f2c1668-dc24-4ef7-bff';
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.projectId) {
        projectId = config.projectId;
      }
    }
  } catch (err) {
    // Ignore, fallback to defaults
  }

  initializeApp({
    projectId: projectId,
  });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    initializeFirebase();
  } catch (err) {
    console.error('[Firebase Admin] Failed lazy initialization:', err);
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[requireAuth] Error verifying Firebase token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
