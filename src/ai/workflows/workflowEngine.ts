import { Project, VideoIdea, SeoResult } from '@/shared/types';
import { validateYouTubeMetadata } from '@/modules/seo/metadataValidator';
import { HookVariation } from '@/ai/agents/hookAgent';
import { MODEL_NAMES } from '@/shared/constants';

/**
 * ============================================================================
 * WORKFLOW ENGINE ARCHITECTURE
 * ============================================================================
 * Orchestrates content scaling pipelines via solid, isolated modular pipelines.
 */

// 1. INPUT VALIDATOR
export interface ValidatorResult {
  isValid: boolean;
  errors: string[];
}

export class InputValidator {
  public static validateProjectInit(title: string, niche: string, audience: string): ValidatorResult {
    const errors: string[] = [];
    if (!title || title.trim().length < 3) {
      errors.push('Focal Topic / Title is required and must be at least 3 characters.');
    }
    if (!niche || niche.trim().length < 2) {
      errors.push('Subject niche is required and must be at least 2 characters.');
    }
    if (!audience || audience.trim().length < 2) {
      errors.push('Target Audience description is required and must be at least 2 characters.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static validateStepInput(currentStep: number, activeProject: Project | null): ValidatorResult {
    const errors: string[] = [];
    if (!activeProject && currentStep > 1) {
      errors.push('Active content manifest project must be initialized first.');
    }
    if (currentStep >= 7 && activeProject && !activeProject.title) {
      errors.push('Script generation requires an active, chosen idea topic title.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 2. CONTEXT BUILDER
export interface WorkflowExecutionContext {
  projectId: string;
  topicTitle: string;
  niche: string;
  audience: string;
  stateStatus: string;
  historicalIdeasCount: number;
  availableScript: boolean;
  availableSeo: boolean;
  compiledHookText: string;
  competitorsIndexed: string[];
}

export class ContextBuilder {
  public static buildContext(project: Project | null): WorkflowExecutionContext {
    if (!project) {
      return {
        projectId: 'NEW_MANIFEST',
        topicTitle: 'No active topic',
        niche: 'Unspecified',
        audience: 'General Audience',
        stateStatus: 'idle',
        historicalIdeasCount: 0,
        availableScript: false,
        availableSeo: false,
        compiledHookText: '',
        competitorsIndexed: ['competitor_spy', 'general_benchmarks']
      };
    }

    const scriptText = project.assets?.script || '';
    const hasScript = scriptText.length > 0;
    const hasSeo = !!project.assets?.seo;
    const ideasList = project.assets?.ideas || [];

    return {
      projectId: project.id,
      topicTitle: project.title,
      niche: project.niche,
      audience: project.audience || 'General Creators',
      stateStatus: project.status,
      historicalIdeasCount: ideasList.length,
      availableScript: hasScript,
      availableSeo: hasSeo,
      compiledHookText: scriptText.substring(0, 150) + (scriptText.length > 150 ? '...' : ''),
      competitorsIndexed: ['competitor_spy', `${project.niche}_dominant_creators`]
    };
  }
}

// 3. AI ROUTER
export type StepAgentTarget = 'IdeasDiscoverer' | 'HookEngineer' | 'ScriptScreenwriter' | 'SeoSemantic' | 'ThumbnailPlanner' | 'RepurposerSocial';

export class AiRouter {
  public static routeAgent(stepId: number): StepAgentTarget {
    switch (stepId) {
      case 3:
      case 4:
        return 'IdeasDiscoverer';
      case 6:
        return 'HookEngineer';
      case 7:
        return 'ScriptScreenwriter';
      case 8:
        return 'SeoSemantic';
      case 9:
        return 'ThumbnailPlanner';
      case 10:
        return 'RepurposerSocial';
      default:
        return 'IdeasDiscoverer';
    }
  }

  public static getTargetModel(target: StepAgentTarget): { model: string; recommendedBudget: number } {
    switch (target) {
      case 'ScriptScreenwriter':
        return { model: MODEL_NAMES.TEXT_PRO, recommendedBudget: 32000 };
      case 'SeoSemantic':
        return { model: MODEL_NAMES.TEXT_SMART, recommendedBudget: 8000 };
      default:
        return { model: MODEL_NAMES.TEXT_SMART, recommendedBudget: 16000 };
    }
  }
}

// 4. PROMPT ENGINE
export class PromptEngine {
  public static getViralTopicPrompt(niche: string, audience: string): string {
    return `You are a viral research strategist. Discover 3 explosive video topics in the "${niche}" niche for "${audience}". 
Focus on low competitive friction but extremely high search urgency.
Return exactly a JSON format like:
{
  "ideas": [
    { "title": "...", "hook": "...", "score": 90, "competition": "Low", "interest": "Exploding" }
  ]
}`;
  }

  public static getHookEngineeringPrompt(topic: string, niche: string, audience: string): string {
    return `Generate 5 psychologically distinct hooks for the video topic: "${topic}". 
Niche: ${niche}. Audience: ${audience}. 
Types to engineer: Curiosity Gap, Fear of Missing Out (FOMO), contrarian counter-intuitive myth, ultra-fast hack, and storytelling opener. 
Ensure peak average view duration (AVD).`;
  }

  public static getScriptScreenplayPrompt(topic: string, tone: string, pacingRules: string): string {
    return `Draft a complete high-retention video screenplay about "${topic}". 
Tone: ${tone}. 
Retention rules: ${pacingRules}.
Include visual direction brackets e.g. [VISUAL: Neon Pink title interrupt] and narration cues. Ensure pacing resets average view duration decay every 12 seconds with patterns.`;
  }

  public static getSeoPrompt(topic: string, niche: string, audience: string): string {
    return `Formulate structured search crawler signals for: "${topic}". Niche: ${niche}. Target audience: ${audience}.
Include semantic tags, search metadata description, and hashtags that ranktica search spider can parse successfully.`;
  }
}

// 5. OUTPUT VALIDATOR
export interface OutputValidationReport {
  score: number;
  status: 'excellent' | 'good' | 'needs_work';
  issues: Array<{ severity: 'warning' | 'error' | 'success'; message: string; description: string }>;
}

export class OutputValidator {
  public static validateMetadataOutput(title: string, description: string, tags: string[], hashtags: string[]): OutputValidationReport {
    const report = validateYouTubeMetadata(title, description, tags, hashtags);
    const score = report.score;
    let status: 'excellent' | 'good' | 'needs_work' = 'needs_work';
    if (score >= 90) status = 'excellent';
    else if (score >= 70) status = 'good';

    return {
      score,
      status,
      // Adapt formatting from validation system format
      issues: report.issues.map(issue => ({
        severity: issue.severity,
        message: issue.message,
        description: issue.description
      }))
    };
  }

  public static validateScriptStructure(scriptText: string): { hasHooks: boolean; wordCount: number; isOptimized: boolean } {
    const wc = scriptText ? scriptText.split(/\s+/).length : 0;
    const hasVisualBrackets = scriptText.includes('[VISUAL');
    const hasAudioCues = scriptText.includes('[AUDIO') || scriptText.includes('[HOOK');

    return {
      hasHooks: hasVisualBrackets || hasAudioCues,
      wordCount: wc,
      isOptimized: wc > 150 && hasVisualBrackets
    };
  }
}

// 6. SAVE ENGINE
export class SaveEngine {
  public static persistAssets(
    activeProject: Project,
    updates: Partial<Project['assets']>,
    updateActiveProject: (updates: Partial<Project>) => void
  ): { persisted: boolean; timestamp: number } {
    try {
      updateActiveProject({
        assets: {
          ...activeProject.assets,
          ...updates
        },
        lastUpdated: Date.now()
      });
      return { persisted: true, timestamp: Date.now() };
    } catch {
      return { persisted: false, timestamp: Date.now() };
    }
  }

  public static persistStatus(
    status: Project['status'],
    updateActiveProject: (updates: Partial<Project>) => void
  ): void {
    updateActiveProject({
      status,
      lastUpdated: Date.now()
    });
  }
}

// 7. ANALYTICS ENGINE
export interface ContentPerformanceForecast {
  predictedCtr: number;
  averageViewDurationPct: number;
  viewerRetentionSlope: string;
  recommendedUploadWindow: string;
  expectedViewsRange: string;
}

export class AnalyticsEngine {
  public static forecastCampaignMetrics(
    niche: string,
    scriptWordCount: number,
    seoScore: number,
    competition: 'Low' | 'Medium' | 'High' = 'Medium',
    demand: 'Stable' | 'Rising' | 'Exploding' = 'Stable'
  ): ContentPerformanceForecast {
    // Math-driven simulation representing high fidelity content algorithm rules
    let ctrBase = 4.5; // standard YouTube CTR
    if (competition === 'Low') ctrBase += 3.2;
    if (competition === 'High') ctrBase -= 1.8;
    if (demand === 'Exploding') ctrBase += 4.5;
    if (demand === 'Rising') ctrBase += 1.8;

    ctrBase = Math.min(18.5, Math.max(1.5, ctrBase));

    let avdPct = 40; // baseline retention
    if (scriptWordCount > 100 && scriptWordCount < 600) {
      avdPct += 12; // optimized length for retention
    }
    if (seoScore > 85) {
      avdPct += 8; // relevant audience targeting increases view duration
    }
    avdPct = Math.min(85, Math.max(15, avdPct));

    let trajectory = '1,200 - 4,500 views (Starter Tier)';
    if (ctrBase > 9 && avdPct > 55) {
      trajectory = '25,000 - 120,000 views (Viral Spike potential)';
    } else if (ctrBase > 6 && avdPct > 45) {
      trajectory = '5,000 - 18,000 views (Consistent Growth Tier)';
    }

    const slopes = [
      'Optimal peak pattern interrupts. Slow decay with search momentum.',
      'Average retention drop off visible on outer minutes, high SEO relevance matches intent.',
      'High friction competition. Requires custom community post targeting to jumpstart.'
    ];

    const chosenSlope = avdPct > 60 ? slopes[0] : avdPct > 40 ? slopes[1] : slopes[2];

    return {
      predictedCtr: parseFloat(ctrBase.toFixed(1)),
      averageViewDurationPct: Math.round(avdPct),
      viewerRetentionSlope: chosenSlope,
      recommendedUploadWindow: 'Tuesdays / Thursdays: 13:00 to 16:00 UTC',
      expectedViewsRange: trajectory
    };
  }
}
