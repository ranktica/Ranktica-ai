import { MODEL_NAMES } from '@/shared/constants';

export interface HookVariation {
  type: 'pattern_interrupt' | 'curiosity_gap' | 'statistical_anomaly' | 'loss_aversion' | 'status_lever';
  hookText: string;
  psychologicalTrigger: string;
  suggestedVisualAction: string;
  durationSecs: number;
}

/**
 * Ranktica High-CTR Hook Engineering & Retention Specialist Agent
 * Crafted to instantly arrest attention in the first 1-15 critical seconds of the playback timeline.
 */
export class HookAgent {
  /**
   * Generates multiple psychologically customized hook formulas for a given video idea.
   */
  async engineerHooks(topic: string, niche: string, audience: string): Promise<HookVariation[]> {
    const prompt = `
You are Ranktica's Viral Hook & Psychological Engineering Agent.
Your single purpose is to draft 5 distinct, high-impact introductory hooks for a video about "${topic}".
NICHE: ${niche}
AUDIENCE: ${audience}

Draft hooks corresponding to the following psychological profiles:
1. **pattern_interrupt**: Strips away expectations instantly with atypical pacing or visual shock.
2. **curiosity_gap**: Questions the viewer in a way that forces them to stick around to receive the answers.
3. **statistical_anomaly**: States a highly shocking or unbelievable metric or trend that is technically accurate.
4. **loss_aversion**: Leverages the natural human instinct to avoid losing resources, time, or competitive standing.
5. **status_lever**: Offers exclusive access, power, or mental advancement to the viewer if they hold retention.

OUTPUT STRICT JSON ONLY MATCHING THE FOLLOWING ARRAY FORMAT:
[
  {
    "type": "pattern_interrupt" | "curiosity_gap" | "statistical_anomaly" | "loss_aversion" | "status_lever",
    "hookText": "string",
    "psychologicalTrigger": "string",
    "suggestedVisualAction": "string",
    "durationSecs": number
  }
]
`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL_NAMES.TEXT_SMART,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) throw new Error('Hook Agent generation failed');

      const result = await response.json();
      const cleanedText = (result.text || "[]").replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('[HookAgent Generation Error - Using High Quality Fallbacks]:', error);
      return [
        {
          type: 'pattern_interrupt',
          hookText: `Stop scrolling! Most creators are completely wasting time trying to scale ${topic}. Let me show you what actually works.`,
          psychologicalTrigger: 'Disrupts classical video greeting structures by challenging standard operations.',
          suggestedVisualAction: 'Host drops an object on a table or makes a sharp clapping sound to break eye saccades.',
          durationSecs: 8
        },
        {
          type: 'curiosity_gap',
          hookText: `There is a single secret behind ${topic} that no top influencer wants you to discover. If you miss it, you stay stagnant.`,
          psychologicalTrigger: 'Withholds the core secret value behind a hidden gate.',
          suggestedVisualAction: 'Host points directly into the camera lens with heavy zoom scaling.',
          durationSecs: 12
        },
        {
          type: 'statistical_anomaly',
          hookText: `Exactly 93% of tutorials explaining ${topic} in the ${niche} workspace are missing one critical step. Yes, ninety-three percent.`,
          psychologicalTrigger: 'Uses mathematically verified high density triggers to create cognitive concern.',
          suggestedVisualAction: 'Red hazard status charts overlaying the screen space instantly.',
          durationSecs: 10
        },
        {
          type: 'loss_aversion',
          hookText: `If you don't adjust your ${niche} setup using this standard formula, your recommendations will likely be throttled within 48 hours.`,
          psychologicalTrigger: 'Triggers the fear of losing existing reach and algorithmic distribution.',
          suggestedVisualAction: 'Highlighting a red, downward status trend graph in the background space.',
          durationSecs: 11
        },
        {
          type: 'status_lever',
          hookText: `In the next 3 minutes, you are getting the exact dashboard systems that took top developers over 6 months to master.`,
          psychologicalTrigger: 'Promises elite scaling advantages in a collapsed timeframe.',
          suggestedVisualAction: 'Host opens an expansive screen-share showing a beautiful visual dashboard mapping.',
          durationSecs: 9
        }
      ];
    }
  }
}
