/**
 * Platform Metrics & Compliance Validator
 * Audits Title configurations, descriptions, tag layout against search engine best practices
 */

export interface ValidationReport {
  score: number; // 0 to 100
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  issues: {
    severity: 'warning' | 'error' | 'success';
    message: string;
    description: string;
  }[];
}

export const validateYouTubeMetadata = (
  title: string,
  description: string,
  tags: string[],
  hashtags: string[]
): ValidationReport => {
  const issues: ValidationReport['issues'] = [];
  let score = 100;

  // Title Audits
  if (!title || title.trim().length === 0) {
    score -= 50;
    issues.push({
      severity: 'error',
      message: 'Title is empty',
      description: 'Your video must have a descriptive title to rank in automated search catalogs.'
    });
  } else {
    const len = title.length;
    if (len > 70) {
      score -= 20;
      issues.push({
        severity: 'warning',
        message: 'Title is too long (over 70 characters)',
        description: 'Long titles get clipped on mobile screens. Keep it under 65 characters to maximize visibility.'
      });
    } else if (len >= 30 && len <= 60) {
      issues.push({
        severity: 'success',
        message: 'Perfect Title length',
        description: 'Your title is concise, readable, and highly optimized for mobile devices.'
      });
    } else if (len < 10) {
      score -= 10;
      issues.push({
        severity: 'warning',
        message: 'Title is too short',
        description: 'Short titles often miss critical keyword anchors needed to find your exact audience.'
      });
    }
  }

  // Description Audits
  if (!description || description.trim().length < 100) {
    score -= 15;
    issues.push({
      severity: 'warning',
      message: 'Description is brief or missing',
      description: 'Add at least 150-300 characters of text describing context to assist index crawlers.'
    });
  } else {
    issues.push({
      severity: 'success',
      message: 'Rich description structured',
      description: 'Crawlers can safely map the semantic structure of your video text.'
    });
  }

  // Tags Audits
  if (tags.length < 5) {
    score -= 10;
    issues.push({
      severity: 'warning',
      message: 'Insufficient custom tags',
      description: 'Use at least 5-10 distinct niche tags to map your video onto the correct semantic recommendations.'
    });
  } else {
    issues.push({
      severity: 'success',
      message: 'Robust keywords populated',
      description: 'Sufficient tags assigned for multi-faceted contextual recommendations.'
    });
  }

  // Hashtags Audits
  if (hashtags.length > 5) {
    score -= 5;
    issues.push({
      severity: 'warning',
      message: 'Over-saturation of hashtags',
      description: 'Using more than 5 hashtags can flag the video as spam in search indexing. Limit is 3-5.'
    });
  }

  const finalScore = Math.max(0, score);
  let status: ValidationReport['status'] = 'excellent';
  if (finalScore < 50) status = 'critical';
  else if (finalScore < 75) status = 'needs_improvement';
  else if (finalScore < 90) status = 'good';

  return {
    score: finalScore,
    status,
    issues
  };
};
