import { Request, Response, NextFunction } from 'express';
import { dbService } from '../services/dbService';

export async function checkCredits(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Missing user authentication context.' });
  }

  const user_id = req.user.uid;
  if (!user_id) {
    return res.status(401).json({ error: 'Unauthorized: Missing user identifier.' });
  }

  try {
    const usages = await dbService.all('SELECT * FROM user_usage WHERE user_id = ?', [user_id]);
    let usage = usages[0];

    // If no user_usage entry exists, automatically construct a default free tier record with 10 credits limit
    if (!usage) {
      await dbService.run(
        'INSERT INTO user_usage (user_id, plan, ai_credits_used, ai_credits_limit) VALUES (?, ?, ?, ?)',
        [user_id, 'free', 0, 10]
      );
      const updatedUsages = await dbService.all('SELECT * FROM user_usage WHERE user_id = ?', [user_id]);
      usage = updatedUsages[0];
    }

    const msInMonth = 30 * 24 * 60 * 60 * 1000;
    const cycleStart = usage.billing_cycle_start || 0;
    if (Date.now() - cycleStart > msInMonth) {
      await dbService.run(
        'UPDATE user_usage SET ai_credits_used = 0, billing_cycle_start = ? WHERE user_id = ?',
        [Date.now(), user_id]
      );
      usage.ai_credits_used = 0;
    }

    // Skip credit check for "angle" or "unlimited" plans
    if (usage && (usage.plan === 'angle' || usage.plan === 'unlimited')) {
      return next();
    }

    if (!usage || usage.ai_credits_used >= usage.ai_credits_limit) {
      return res.status(402).json({ error: 'Credit limit reached', upgrade: true });
    }

    // Increment credits used
    await dbService.run('UPDATE user_usage SET ai_credits_used = ai_credits_used + 1 WHERE user_id = ?', [user_id]);
    next();
  } catch (error: any) {
    console.error('Error within checkCredits middleware:', error);
    return res.status(500).json({ error: 'Database verification failed', details: error.message });
  }
}
