import { MODEL_NAMES } from '@/shared/constants';

/**
 * Ranktica Creative Scriptwriting & Visual Direction AI Agent
 * Bridges the gap between conversational narration and technical audio/video layout.
 */
export class ScriptAgent {
  /**
   * Generates a structural narrative breakdown of a script before full draft execution.
   */
  async generateStoryboardOutline(title: string, niche: string, audience: string): Promise<string> {
    const prompt = `
You are a YouTube Storyboard Visual Director.
Create a structured list of scenes, narrative objectives, and pacing recommendations for a video about "${title}".
NICHE: ${niche}
AUDIENCE: ${audience}

Highlight retention hooks, timing markers, and visual flow suggestions. No code, just raw clean Markdown text.
`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL_NAMES.TEXT_SMART,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error('Storyboard generation failed');
      const result = await response.json();
      return result.text || 'Storyboard drafting completed.';
    } catch (error) {
      console.error('[ScriptAgent Storyboard Error]:', error);
      return `### STORYBOARD OUTLINE FOR "${title}"\n- **Chapter 1: The Fast Hook (0-15s)**: Interrupt status quo, state value proposition.\n- **Chapter 2: The Core Problem (15-60s)**: Empathize with target pain-points.\n- **Chapter 3: The Secret Blueprint (1m-4m)**: Deploy high-density value elements.\n- **Chapter 4: The Closed Retention Loop (4m-5m)**: Guide viewer into clicking the next recommendation.`;
    }
  }

  /**
   * Generates a fully formatted retention script with technical stage directions.
   */
  async generateScript(
    title: string,
    tone: string,
    pacing: string,
    instructions: string,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const prompt = `
You are Ranktica's Lead Scriptwriting & Engagement Agent.
Your task is to write a full-length, high-retention video script.

VIDEO TITLE: "${title}"
TONE MATCH: "${tone}"
PACING RULES: "${pacing}"
SPECIAL INSTRUCTIONS: "${instructions}"

Structure the script using standard audiovisual video layout with clear bracketed indicators:
- Visual guidelines, camera angles, and graphic calls: e.g. [VISUAL: Close-up on speaker, animated text sparks on screen]
- Auditory sound effects or music shifts: e.g. [AUDIO: Upbeat synth starts softly]
- Spoken narration itself with emphasis blocks.

Structure of sections:
1. **0:00 - 0:15 [HIGH-IMPACT VIRAL HOOK]**
2. **0:15 - 1:00 [PROBLEM ESTABLISHMENT & STAKES]**
3. **1:00 - 3:00 [NARRATIVE ESCALATION & EXPOSITIONAL VALUE]**
4. **3:00+ [CALL TO ACTION & RETENTION ENGAGEMENT LOOP]**
`;

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL_NAMES.TEXT_SMART,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          stream: !!onChunk
        })
      });

      if (!response.ok) throw new Error('Script generation failed');

      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullText += chunk;
          onChunk(chunk);
        }
        return fullText;
      } else {
        const result = await response.json();
        return result.text || 'Draft script generated successfully.';
      }
    } catch (error) {
      console.error('[ScriptAgent Generation Error]:', error);
      return `### FALLBACK VIDEO SCRIPT: ${title}
[AUDIO: Dynamic beat drop]
[VISUAL: Bright intro loop, title text fades in]
**0:00 - 0:15 [THE HOOK]**
"If you are still struggling with ${title}, here is exactly why you aren't seeing results yet. But in the next 3 minutes, we are changing that forever."

[VISUAL: Transition wipe to host screen presentation]
**0:15 - 1:00 [THE PROBLEM]**
"The truth is, most creators only look at surface-level content, missing the core structural factors. Let's dig in."

[VISUAL: Cinematic B-roll overlay with zoom points]
**1:00 - 3:00 [THE blueprint]**
"First, align your metadata semantic clusters. Second, focus on high-fidelity thumbnail design setups. Avoid typical visual clutter..."

[AUDIO: Background loops soft swell]
**3:00+ [CLOSED LOOP CALL-TO-ACTION]**
"Want the complete optimization spreadsheet template for free? Drop a link response down below and click here to inspect your competitor channels!"`;
    }
  }
}
