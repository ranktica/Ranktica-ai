import { MODEL_NAMES } from '@/shared/constants';

export interface ThumbnailCompositionPlan {
  headlineSummary: string; // Punchy text overlay, under 4 words
  colorPsychology: {
    dominant: string;
    accent: string;
    vibeExplanation: string;
  };
  visualElements: string[]; // List of specific graphical units or objects
  compositionType: 'rule_of_thirds' | 'split_comparison' | 'close_up_emphasis' | 'bento_showcase';
  graphicDetails: string; // Specific instructions on visual layout, typography, lighting
  suggestedAIPrompt: string; // Highly optimized prompt for modern image generators like Imagen or Gemini flash image
}

/**
 * Ranktica High-CTR Thumbnail Design & Visual Strategy AI Agent
 * Directs visual compositions, contrast ratios, text overlays, and coordinates image generation.
 */
export class ThumbnailAgent {
  /**
   * Plans a complete thumbnail visual schema based on project attributes.
   */
  async planComposition(videoTitle: string, niche: string, audience: string): Promise<ThumbnailCompositionPlan> {
    const prompt = `
You are Ranktica's Art Direction & CTR Thumbnail Composition Agent.
Your job is to formulate a high-CTR visual thumbnail plan for a video about: "${videoTitle}".
NICHE: ${niche}
AUDIENCE: ${audience}

Rules for high performance:
- Overlay text must NEVER mirror the title; it must contain a maximum of 3-4 highly punchy, high-tension words.
- Colors must be high contrast (e.g. Neon green, neon red, or vibrant orange against deep metallic slate backgrounds).
- Layout compositions should follow recognized visual formats: split comparison, dramatic focal point, or rich showcase.

OUTPUT STRICT JSON ONLY MATCHING THE FOLLOWING SCHEMA:
{
  "headlineSummary": "string",
  "colorPsychology": {
    "dominant": "string",
    "accent": "string",
    "vibeExplanation": "string"
  },
  "visualElements": ["string"],
  "compositionType": "rule_of_thirds" | "split_comparison" | "close_up_emphasis" | "bento_showcase",
  "graphicDetails": "string",
  "suggestedAIPrompt": "string"
}
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

      if (!response.ok) throw new Error('Thumbnail Agent composition planning failed');

      const result = await response.json();
      const cleanedText = (result.text || "{}").replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('[ThumbnailAgent Planning Error - Using Premium Fallbacks]:', error);
      return {
        headlineSummary: "DO THIS FIRST",
        colorPsychology: {
          dominant: "Deep Charcoal Black / Space Slate",
          accent: "Vibrant Cyan / Cyber Neon Pink",
          vibeExplanation: "Constructs a futuristic tech atmosphere emphasizing urgent authority, matching the premium solo developer vibe perfectly."
        },
        visualElements: [
          "Host with shocked, smiling facial expression strictly located on the left-hand rule of thirds.",
          "Brilliant cyber-themed abstract interface floating in mid-air.",
          "Bold, customized sans-serif italic typography with high-contrast text wrapping strokes."
        ],
        compositionType: 'rule_of_thirds',
        graphicDetails: "Ensure optimal lighting separation. The background must possess a slight Gaussian blur to thrust the host and text overlays forward into viewer view space.",
        suggestedAIPrompt: `High-contrast, epic cinematic YouTube thumbnail showcasing an abstract digital developer grid, vibrant neon cyan accents, metallic charcoal atmosphere, ultra-detailed 4k presentation, cinematic lens flare.`
      };
    }
  }
}
