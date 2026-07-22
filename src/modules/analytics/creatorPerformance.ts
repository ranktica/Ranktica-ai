/**
 * Creator Predictor & Growth Forecasting Mathematics Node
 */

export interface PerformanceForecast {
  estimatedCtr: number; // percentage
  predictedViewsRange: { min: number; max: number };
  retentionEstimate: number; // seconds
  vitalityQuotient: number; // scale of 100
  leversOfAmplication: string[];
}

export const analyzeRetentionFactors = (
  niche: string,
  scriptLengthWords: number,
  titleScore: number
): PerformanceForecast => {
  // Baseline Calculations
  let ctrBase = 4.2; // default avg is ~4%
  let vitalityFactor = 50;

  // Adapt to Niches
  const formattedNiche = niche.toLowerCase();
  if (formattedNiche.includes('ai') || formattedNiche.includes('tech')) {
    ctrBase = 6.8;
    vitalityFactor += 15;
  } else if (formattedNiche.includes('cooking') || formattedNiche.includes('art')) {
    ctrBase = 5.2;
    vitalityFactor += 5;
  }

  // Factor in quality of Headline Scoring
  const titleMultiplier = titleScore / 10;
  const estimatedCtr = Math.min(18.5, Math.max(1.5, ctrBase * titleMultiplier));

  // Word Count / Average Pace estimate for retention
  // Standard speaking speed: ~140 words/minute
  const estimatedDurationSecs = Math.round((scriptLengthWords / 140) * 60);
  const retentionEstimate = Math.round(estimatedDurationSecs * 0.52); // Assumed 52% average relative retention rate

  // Expected Views
  const baseViews = 1200;
  const growthVolume = Math.round(baseViews * (estimatedCtr / ctrBase) * (vitalityFactor / 50));
  const predictedViewsRange = {
    min: Math.round(growthVolume * 0.4),
    max: Math.round(growthVolume * 3.5)
  };

  const leversOfAmplication: string[] = [];
  if (estimatedCtr > 8.0) {
    leversOfAmplication.push('Hyper-Focused Interest Wave: Your headline matches high-ctr patterns.');
  } else {
    leversOfAmplication.push('Title Revamping Required: Introduce curiosity gaps to boost CTR.');
  }

  if (estimatedDurationSecs < 60) {
    leversOfAmplication.push('Shorts Speed Wave: Excellent potential for high looping completion.');
  } else {
    leversOfAmplication.push('Mid-form Retention Focus: Insert a pattern interrupt hook every 45s.');
  }

  return {
    estimatedCtr: parseFloat(estimatedCtr.toFixed(1)),
    predictedViewsRange,
    retentionEstimate,
    vitalityQuotient: Math.min(100, Math.max(10, Math.round(vitalityFactor))),
    leversOfAmplication
  };
};
