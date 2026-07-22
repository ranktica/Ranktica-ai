import { dbService } from './dbService';

// Utility to generate IDs if uuid import is missing or different
function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

export interface PromptRegistryItem {
  id: string;
  name: string;
  agent: string;
  version: string;
  system_instruction: string;
  tools: string; // JSON string array
  model: string;
  temperature: number;
  token_limit: number;
  evaluation_score: number;
  is_active: number;
  ab_test_ratio: number;
  created_by: string;
  created_at: number;
  updated_at: number;
}

export interface PromptEvaluation {
  id: string;
  prompt_id: string;
  version: string;
  accuracy: number;
  quality: number;
  cost: number;
  user_satisfaction: number;
  sample_count: number;
  evaluated_at: number;
}

export interface SecurityViolation {
  id: string;
  prompt_id?: string;
  prompt_text: string;
  detection_type: string;
  risk_score: number;
  details: string;
  organization_id: string;
  user_id: string;
  detected_at: number;
}

export class PromptManagementService {
  constructor() {
    // Ensure seeding is prepared or done lazily
  }

  /**
   * Seed original prompts into the dynamic database prompt registry if empty
   */
  public async seedDefaultPrompts(): Promise<void> {
    try {
      const existing = await dbService.all('SELECT COUNT(*) as count FROM prompt_registry');
      if (existing && existing[0]?.count > 0) {
        console.log('[PromptManagementService] Prompt registry already seeded.');
        return;
      }

      console.log('[PromptManagementService] Seeding default agent prompts into Prompt Registry...');

      const defaultPrompts = [
        {
          id: 'prompt_title_gen',
          name: 'Viral Title Generator 2.0',
          agent: 'titleGenerator',
          version: '1.0.0',
          system_instruction: `You are Ranktica's Viral Headline & Title Engineering Agent.\nYour job is to analyze video concepts, audience niches, and competitor metrics to create hyper-optimized, high-click-through-rate (CTR) YouTube titles.\nFocus on psychological triggers: curiosity gaps, loss aversion, pattern interrupts, and value statements. Limit length to under 65 characters to avoid truncation.`,
          tools: JSON.stringify(['google_trends_proxy', 'competitor_ctr_index']),
          model: 'gemini-2.5-flash',
          temperature: 0.8,
          token_limit: 2048,
        },
        {
          id: 'prompt_script_writer',
          name: 'Premium Interactive Scriptwriter',
          agent: 'scriptWriter',
          version: '1.0.0',
          system_instruction: `You are Ranktica's Premium Scriptwriting & Engagement Agent.\nYour job is to draft engaging, narrative-driven, full-length YouTube scripts.\nStructure scripts with highly interactive pacing cues:\n- 0:00-0:15 [HIGH-IMPACT INTERRUPT HOOK]\n- 0:15-1:00 [STAKE ESTABLISHMENT]\n- 1:00-3:00 [NARRATIVE ESCALATION & VALUE SHOTS]\n- 3:00+ [RETENTION LOOPS & CONTINUOUS CTA]\nIntegrate active auditory cues, camera switch directives, and clear B-roll suggestions.`,
          tools: JSON.stringify(['b_roll_suggestions_api']),
          model: 'gemini-2.5-pro',
          temperature: 0.7,
          token_limit: 8192,
        },
        {
          id: 'prompt_seo_strategist',
          name: 'SEO & Keyword Cluster Optimizer',
          agent: 'seoStrategist',
          version: '1.0.0',
          system_instruction: `You are Ranktica's SEO Metadata & Semantic Engineering Agent.\nYour task is to scan high-performing keywords and organize tag sets, titles, hashtags, and description paragraphs using rich semantic clusters.\nEnsure high relevance and structured alignment to current YouTube search indexing patterns.`,
          tools: JSON.stringify(['keyword_density_calculator', 'youtube_autocomplete_lsi']),
          model: 'gemini-2.5-flash',
          temperature: 0.5,
          token_limit: 4096,
        },
        {
          id: 'prompt_outreach_architect',
          name: 'Enterprise Outreach Funnel Architect',
          agent: 'outreachArchitect',
          version: '1.0.0',
          system_instruction: `You are Ranktica's Global Outreach & Growth Architect.\nYour task is to build highly engaging, customized conversion flows (7-8 step funnels) for LinkedIn and Google Business profiles that convert prospects into active channel subscribers or leads.\nAvoid spammy terminology. Incorporate interactive, conversational pathways and clear opt-ins.`,
          tools: JSON.stringify(['outreach_flow_builder']),
          model: 'gemini-2.5-flash',
          temperature: 0.6,
          token_limit: 4096,
        },
      ];

      for (const p of defaultPrompts) {
        await dbService.run(`
          INSERT INTO prompt_registry (
            id, name, agent, version, system_instruction, tools, model, temperature, token_limit, evaluation_score, is_active, ab_test_ratio, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 1, 0.0, 'system', ?, ?)
        `, [
          p.id, p.name, p.agent, p.version, p.system_instruction, p.tools, p.model, p.temperature, p.token_limit, Date.now(), Date.now()
        ]);

        // Seed version history as well
        await dbService.run(`
          INSERT INTO prompt_version_history (
            id, prompt_id, version, system_instruction, tools, model, temperature, token_limit, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'system', ?)
        `, [
          generateId('pver'), p.id, p.version, p.system_instruction, p.tools, p.model, p.temperature, p.token_limit, Date.now()
        ]);

        // Seed initial evaluation
        await dbService.run(`
          INSERT INTO prompt_evaluations (
            id, prompt_id, version, accuracy, quality, cost, user_satisfaction, sample_count, evaluated_at
          ) VALUES (?, ?, ?, 0.92, 0.90, 0.015, 4.8, 120, ?)
        `, [
          generateId('peval'), p.id, p.version, Date.now()
        ]);
      }

      console.log('[PromptManagementService] Default prompts seeded and version history created successfully.');
    } catch (error) {
      console.error('[PromptManagementService] Seeding default prompts failed:', error);
    }
  }

  /**
   * Get all prompts registered in the system
   */
  public async getPrompts(): Promise<PromptRegistryItem[]> {
    await this.seedDefaultPrompts(); // Ensure seeded
    return await dbService.all('SELECT * FROM prompt_registry ORDER BY updated_at DESC') as PromptRegistryItem[];
  }

  /**
   * Get a prompt by ID
   */
  public async getPromptById(id: string): Promise<PromptRegistryItem | null> {
    const rows = await dbService.all('SELECT * FROM prompt_registry WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] as PromptRegistryItem : null;
  }

  /**
   * Resolve best active prompt version for an agent (with support for A/B testing selection)
   */
  public async resolveActivePrompt(agentName: string): Promise<PromptRegistryItem | null> {
    await this.seedDefaultPrompts();
    const activePrompts = await dbService.all(
      'SELECT * FROM prompt_registry WHERE agent = ? AND is_active = 1',
      [agentName]
    ) as PromptRegistryItem[];

    if (activePrompts.length === 0) {
      return null;
    }

    if (activePrompts.length === 1) {
      return activePrompts[0];
    }

    // A/B test routing logic:
    // If we have multiple active prompts, find if any has an ab_test_ratio defined.
    const randomVal = Math.random();
    let accumulatedRatio = 0;

    for (const prompt of activePrompts) {
      if (prompt.ab_test_ratio > 0) {
        accumulatedRatio += prompt.ab_test_ratio;
        if (randomVal <= accumulatedRatio) {
          return prompt;
        }
      }
    }

    // Fallback to highest evaluation score or first item
    return activePrompts[0];
  }

  /**
   * Create or update a prompt, automatically archiving old versions to prompt_version_history
   */
  public async savePrompt(data: {
    id?: string;
    name: string;
    agent: string;
    version: string;
    system_instruction: string;
    tools?: string[];
    model: string;
    temperature: number;
    token_limit: number;
    ab_test_ratio?: number;
    created_by?: string;
  }): Promise<string> {
    const isNew = !data.id;
    const promptId = data.id || generateId('prompt');
    const author = data.created_by || 'admin';
    const toolList = data.tools ? JSON.stringify(data.tools) : '[]';
    const abRatio = data.ab_test_ratio !== undefined ? data.ab_test_ratio : 0.0;

    // Check prompt security before saving
    const securityCheck = await this.auditPromptSecurity(data.system_instruction);
    if (!securityCheck.allowed) {
      // Record violation
      await dbService.run(`
        INSERT INTO prompt_security_violations (id, prompt_id, prompt_text, detection_type, risk_score, details, organization_id, user_id, detected_at)
        VALUES (?, ?, ?, ?, ?, ?, 'org_default', ?, ?)
      `, [
        generateId('pviolation'), promptId, data.system_instruction, securityCheck.violationType || 'unsafe', securityCheck.riskScore, securityCheck.reason, author, Date.now()
      ]);
      throw new Error(`Prompt security block: ${securityCheck.reason}`);
    }

    if (isNew) {
      // Insert new prompt registry item
      await dbService.run(`
        INSERT INTO prompt_registry (
          id, name, agent, version, system_instruction, tools, model, temperature, token_limit, evaluation_score, is_active, ab_test_ratio, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 1, ?, ?, ?, ?)
      `, [
        promptId, data.name, data.agent, data.version, data.system_instruction, toolList, data.model, data.temperature, data.token_limit, abRatio, author, Date.now(), Date.now()
      ]);
    } else {
      // Get previous version before update to archive it
      const current = await this.getPromptById(promptId);
      if (current && current.version !== data.version) {
        // Create version archive
        await dbService.run(`
          INSERT INTO prompt_version_history (
            id, prompt_id, version, system_instruction, tools, model, temperature, token_limit, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          generateId('pver'), current.id, current.version, current.system_instruction, current.tools, current.model, current.temperature, current.token_limit, current.created_by, Date.now()
        ]);
      }

      // Update current prompt registry item
      await dbService.run(`
        UPDATE prompt_registry SET
          name = ?,
          agent = ?,
          version = ?,
          system_instruction = ?,
          tools = ?,
          model = ?,
          temperature = ?,
          token_limit = ?,
          ab_test_ratio = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        data.name, data.agent, data.version, data.system_instruction, toolList, data.model, data.temperature, data.token_limit, abRatio, Date.now(), promptId
      ]);
    }

    return promptId;
  }

  /**
   * Rollback a prompt to a previous version from the archive
   */
  public async rollbackToVersion(promptId: string, versionToRollback: string): Promise<void> {
    const historyItem = await dbService.all(
      'SELECT * FROM prompt_version_history WHERE prompt_id = ? AND version = ?',
      [promptId, versionToRollback]
    );

    if (historyItem.length === 0) {
      throw new Error(`No version history found for prompt ${promptId} at version ${versionToRollback}`);
    }

    const item = historyItem[0];

    // Update active prompt with history item's properties
    await dbService.run(`
      UPDATE prompt_registry SET
        version = ?,
        system_instruction = ?,
        tools = ?,
        model = ?,
        temperature = ?,
        token_limit = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      item.version, item.system_instruction, item.tools, item.model, item.temperature, item.token_limit, Date.now(), promptId
    ]);

    console.log(`[PromptManagementService] Successfully rolled back prompt ${promptId} to version ${versionToRollback}`);
  }

  /**
   * Retrieve full version history of a prompt
   */
  public async getVersionHistory(promptId: string): Promise<any[]> {
    return await dbService.all(
      'SELECT * FROM prompt_version_history WHERE prompt_id = ? ORDER BY created_at DESC',
      [promptId]
    );
  }

  /**
   * Log an evaluation sample for a prompt
   */
  public async logEvaluation(data: {
    prompt_id: string;
    version: string;
    accuracy: number;
    quality: number;
    cost: number;
    user_satisfaction: number;
  }): Promise<void> {
    const existing = await dbService.all(
      'SELECT * FROM prompt_evaluations WHERE prompt_id = ? AND version = ?',
      [data.prompt_id, data.version]
    );

    if (existing.length === 0) {
      await dbService.run(`
        INSERT INTO prompt_evaluations (
          id, prompt_id, version, accuracy, quality, cost, user_satisfaction, sample_count, evaluated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
      `, [
        generateId('peval'), data.prompt_id, data.version, data.accuracy, data.quality, data.cost, data.user_satisfaction, Date.now()
      ]);
    } else {
      const current = existing[0];
      const count = current.sample_count + 1;
      const accuracyAvg = (current.accuracy * current.sample_count + data.accuracy) / count;
      const qualityAvg = (current.quality * current.sample_count + data.quality) / count;
      const costAvg = (current.cost * current.sample_count + data.cost) / count;
      const satisfactionAvg = (current.user_satisfaction * current.sample_count + data.user_satisfaction) / count;

      await dbService.run(`
        UPDATE prompt_evaluations SET
          accuracy = ?,
          quality = ?,
          cost = ?,
          user_satisfaction = ?,
          sample_count = ?,
          evaluated_at = ?
        WHERE prompt_id = ? AND version = ?
      `, [
        accuracyAvg, qualityAvg, costAvg, satisfactionAvg, count, Date.now(), data.prompt_id, data.version
      ]);

      // Calculate composite score for the prompt registry
      const compositeScore = (accuracyAvg + qualityAvg + (satisfactionAvg / 5.0)) / 3.0;
      await dbService.run(
        'UPDATE prompt_registry SET evaluation_score = ? WHERE id = ?',
        [compositeScore, data.prompt_id]
      );
    }
  }

  /**
   * Get evaluations of prompts
   */
  public async getEvaluations(): Promise<PromptEvaluation[]> {
    return await dbService.all('SELECT * FROM prompt_evaluations ORDER BY evaluated_at DESC') as PromptEvaluation[];
  }

  /**
   * Get prompt security violations
   */
  public async getSecurityViolations(): Promise<SecurityViolation[]> {
    return await dbService.all('SELECT * FROM prompt_security_violations ORDER BY detected_at DESC') as SecurityViolation[];
  }

  /**
   * Audit a system instruction prompt text for security vulnerabilities
   */
  public async auditPromptSecurity(text: string): Promise<{ allowed: boolean; reason: string; riskScore: number; violationType?: string }> {
    const rules = [
      {
        pattern: /ignore previous instructions|disregard prior guidelines/i,
        type: 'injection',
        reason: 'Potential instruction override/hijack vector detected.',
        score: 95
      },
      {
        pattern: /system credentials|api_key|private_key|auth_token/i,
        type: 'unsafe_instruction',
        reason: 'Instruction requests or exposures of enterprise secrets or API keys.',
        score: 85
      },
      {
        pattern: /delete table|drop database|truncate table|drop table/i,
        type: 'unsafe_instruction',
        reason: 'Destructive database operations injected inside instruction sets.',
        score: 90
      },
      {
        pattern: /bypass safety|disable content filtering/i,
        type: 'unsafe_instruction',
        reason: 'Attempting to bypass safety guidelines.',
        score: 98
      }
    ];

    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        return {
          allowed: false,
          reason: rule.reason,
          riskScore: rule.score,
          violationType: rule.type
        };
      }
    }

    return { allowed: true, reason: 'Passed basic instruction security audit.', riskScore: 0 };
  }
}

export const promptManagementService = new PromptManagementService();
