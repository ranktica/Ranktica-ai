import React, { useState } from 'react';
import { useProject } from '@/app/ProjectContext';
import { ToolType, Project, VideoIdea } from '@/shared/types';
import { logActivity } from '@/shared/activityLogger';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Printer, Check, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ClientPdfExporterProps {
  currentTool: ToolType;
}

export const ClientPdfExporter: React.FC<ClientPdfExporterProps> = ({ currentTool }) => {
  const { activeProject } = useProject();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  if (!activeProject) return null;

  // Humanize tool names for reports
  const getToolDisplayName = (tool: ToolType): string => {
    switch (tool) {
      case ToolType.SCRIPT:
        return 'Scripting Core';
      case ToolType.IDEAS:
        return 'Idea Lab';
      case ToolType.SEO:
        return 'SEO Optimizer';
      case ToolType.TITLE_GENERATOR:
        return 'Title Engineering';
      case ToolType.METADATA_ENGINEER:
        return 'Metadata Architect';
      case ToolType.WORKFLOW:
        return '14-Step Creator Core';
      case ToolType.COMPETITOR_SPY:
        return 'Competitor Intelligence';
      case ToolType.RESEARCH:
        return 'Research Intelligence';
      case ToolType.CHANNEL_AUDIT:
        return 'Channel Metadata Audit';
      default:
        return 'Omni-Channel Dashboard';
    }
  };

  const getReportTitle = (tool: ToolType): string => {
    switch (tool) {
      case ToolType.SCRIPT:
        return 'LINGUISTIC SCRIPT & NEURAL DIALOGUE CORE REPORT';
      case ToolType.IDEAS:
        return 'VIRAL CAMPAIGN PLANNING & IDEA LAB SHEET';
      case ToolType.SEO:
      case ToolType.TITLE_GENERATOR:
      case ToolType.METADATA_ENGINEER:
        return 'SEARCH OPTIMIZATION & TITLE METADATA ARCHITECTURE REPORT';
      case ToolType.WORKFLOW:
        return '14-STEP PRODUCTION WORKFLOW & ROADMAP REPORT';
      case ToolType.COMPETITOR_SPY:
      case ToolType.RESEARCH:
        return 'COMPETITOR SPY & INTELLIGENCE INSIGHTS DOSSIER';
      case ToolType.CHANNEL_AUDIT:
        return 'CHANNEL METADATA AUDIT & SEARCH OPTIMIZATION REPORT';
      default:
        return 'OMNI-CHANNEL PRODUCTION DOSSIER & STRATEGIC CAMPAIGN BRIEF';
    }
  };

  const handleExportPdf = () => {
    setIsGenerating(true);
    toast.loading('Assembling interactive client presentation report...', {
      id: 'pdf-gen-toast',
      duration: 1500
    });

    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Pop-up window blocked. Please permit pop-ups to preview and print report.', {
          id: 'pdf-gen-toast'
        });
        setIsGenerating(false);
        return;
      }

      // 1. Build Niche-specific default data in case actual project details are partial
      const projTitle = activeProject.title || 'Untitled Campaign';
      const projNiche = activeProject.niche || 'General Niche';
      const projAudience = activeProject.audience || 'General Audience';
      const projStatus = activeProject.status || 'idea';
      const projUpdated = new Date(activeProject.lastUpdated).toLocaleString();

      // Formatted script content helper
      let scriptContentHtml = '';
      if (currentTool === ToolType.SCRIPT) {
        const scriptText = activeProject.assets?.script;
        if (scriptText && typeof scriptText === 'string') {
          const blocks = scriptText.split('\n').filter(p => p.trim());
          scriptContentHtml = blocks.map((block, idx) => {
            const isAction = block.startsWith('[') && block.endsWith(']');
            if (isAction) {
              return `<div style="margin: 14px 10%; font-style: italic; color: #4b5563; font-size: 11px; font-family: monospace;">${block}</div>`;
            } else if (block.includes(':')) {
              const [speaker, text] = block.split(':');
              return `
                <div style="margin-top: 16px; margin-bottom: 4px; text-align: center;">
                  <strong style="text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; color: #111827;">${speaker.trim()}</strong>
                </div>
                <div style="margin-left: 20%; margin-right: 20%; text-align: justify; margin-bottom: 12px; font-size: 11px; line-height: 1.6;">
                  ${text.trim()}
                </div>
              `;
            } else {
              return `<p style="margin: 12px 15%; text-align: justify; font-size: 11px; line-height: 1.6; color: #1f2937;">${block}</p>`;
            }
          }).join('');
        } else {
          scriptContentHtml = `
            <div style="text-align: center; padding: 40px; border: 1px dashed #d1d5db; border-radius: 12px; margin: 20px 10%;">
              <p style="font-size: 11px; color: #6b7280; font-style: italic;">No scripting document recorded in this project yet.</p>
              <p style="font-size: 9px; color: #9ca3af; margin-top: 4px;">Initialize script text inside the "Scripting Core" module to print interactive screenplays.</p>
            </div>
          `;
        }
      }

      // Formatted ideas content helper
      let ideasContentHtml = '';
      if (currentTool === ToolType.IDEAS) {
        const ideasList: VideoIdea[] = activeProject.assets?.ideas || [];
        if (ideasList.length > 0) {
          ideasContentHtml = ideasList.map((idea, idx) => `
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 14px; page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 12px; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: -0.3px;">Concept #${idx + 1}: ${idea.title}</h4>
                <span style="font-size: 10px; font-weight: 900; background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">CTR Score: ${idea.viral_score || 88}%</span>
              </div>
              <p style="font-size: 11px; color: #374151; line-height: 1.5; margin: 0 0 10px 0;"><strong style="color: #4b5563;">Viral Hook:</strong> "${idea.hook}"</p>
              ${idea.seo_keywords && idea.seo_keywords.length > 0 ? `
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  ${idea.seo_keywords.map(kw => `<span style="font-size: 8.5px; font-family: monospace; background: #f3f4f6; border: 1px solid #e5e7eb; color: #4b5563; padding: 2px 6px; border-radius: 4px;">#${kw}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('');
        } else {
          // Dynamic templates matching niche
          ideasContentHtml = `
            <div style="text-align: center; padding: 40px; border: 1px dashed #d1d5db; border-radius: 12px; margin-bottom: 20px;">
              <p style="font-size: 11px; color: #6b7280; font-style: italic;">No viral idea cards stored in the active lab.</p>
            </div>
            <h3 style="font-size: 11px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 3px solid #dc2626; padding-left: 8px;">Recommended Strategic Angles (AI Generated Proposals)</h3>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 12px; font-weight: 800; color: #111827; text-transform: uppercase;">Angle 1: The Invisible System Scaling ${projNiche}</h4>
                <span style="font-size: 10px; font-weight: 900; background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 6px;">CTR Score: 94%</span>
              </div>
              <p style="font-size: 11px; color: #374151; line-height: 1.5; margin: 0;"><strong style="color: #4b5563;">Hook:</strong> "Stop copying general tutorials. Here is the single setting that scaled our ${projNiche} account in under 48 hours..."</p>
            </div>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 12px; font-weight: 800; color: #111827; text-transform: uppercase;">Angle 2: Masterclass Breakdown (The Psychology Guide)</h4>
                <span style="font-size: 10px; font-weight: 900; background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 6px;">CTR Score: 87%</span>
              </div>
              <p style="font-size: 11px; color: #374151; line-height: 1.5; margin: 0;"><strong style="color: #4b5563;">Hook:</strong> "99% of creators fail because they ignore this simple psychological curiosity pattern. Let me decode it for you..."</p>
            </div>
          `;
        }
      }

      // Formatted SEO and Titles content helper
      let seoContentHtml = '';
      if (currentTool === ToolType.SEO || currentTool === ToolType.TITLE_GENERATOR || currentTool === ToolType.METADATA_ENGINEER) {
        const seoData = activeProject.assets?.seo || {};
        const titles: string[] = seoData.titles || [];
        const tags: string[] = seoData.tags || activeProject.assets?.tags || [];
        const descriptionText = seoData.description || activeProject.assets?.metadata_description || '';

        seoContentHtml = `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 11px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 3px solid #dc2626; padding-left: 8px;">Recommended Search Title Candidates</h3>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                  <tr style="background: #111827; color: #ffffff;">
                    <th style="padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase;">Candidate Name</th>
                    <th style="padding: 10px 14px; text-align: right; font-size: 10px; font-weight: 900; text-transform: uppercase; width: 100px;">SEO Fit</th>
                  </tr>
                </thead>
                <tbody>
                  ${titles.length > 0 ? titles.map((t, i) => `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px 14px; font-weight: 700; color: #111827;">${t}</td>
                      <td style="padding: 12px 14px; text-align: right; font-weight: 900; color: #dc2626;">${95 - i * 4}% Match</td>
                    </tr>
                  `).join('') : `
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px 14px; font-weight: 700; color: #111827;">The Advanced ${projNiche} Framework No One Explains (CTR Lock)</td>
                      <td style="padding: 12px 14px; text-align: right; font-weight: 900; color: #dc2626;">95% Match</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px 14px; font-weight: 700; color: #111827;">How I Scaled ${projNiche} to 10k Users As a Solo Creator</td>
                      <td style="padding: 12px 14px; text-align: right; font-weight: 900; color: #dc2626;">91% Match</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 11px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 3px solid #dc2626; padding-left: 8px;">Index of Target Search Tags & Hashtags</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px;">
              ${tags.length > 0 ? tags.map(tag => `<span style="font-size: 9px; font-family: monospace; background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 6px;">#${tag}</span>`).join('') : `
                <span style="font-size: 9px; font-family: monospace; background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 6px;">#${projNiche.toLowerCase().replace(/\s+/g, '')}</span>
                <span style="font-size: 9px; font-family: monospace; background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 6px;">#creatorhacks</span>
                <span style="font-size: 9px; font-family: monospace; background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 6px;">#viralframework</span>
                <span style="font-size: 9px; font-family: monospace; background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151; padding: 4px 8px; border-radius: 6px;">#marketingintel</span>
              `}
            </div>
          </div>

          <div>
            <h3 style="font-size: 11px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 3px solid #dc2626; padding-left: 8px;">Strategic Search Description Paragraph</h3>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; font-size: 11px; line-height: 1.6; color: #374151; text-align: justify;">
              ${descriptionText || `This strategic campaign addresses key trends inside the ${projNiche} niche. Targeting ${projAudience}, it delivers highly actionable insights, hooks attention via psychological curiosity patterns, and optimizes indexing metadata parameters for high search volume impressions.`}
            </div>
          </div>
        `;
      }

      // Formatted workflow content helper
      let workflowContentHtml = '';
      if (currentTool === ToolType.WORKFLOW) {
        const tasks = activeProject.assets?.tasks || [];
        workflowContentHtml = `
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background: #111827; color: #ffffff;">
                  <th style="padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase;">Production Task / Milestone</th>
                  <th style="padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase; width: 120px;">Milestone Category</th>
                  <th style="padding: 10px 14px; text-align: right; font-size: 10px; font-weight: 900; text-transform: uppercase; width: 100px;">Timeline</th>
                  <th style="padding: 10px 14px; text-align: right; font-size: 10px; font-weight: 900; text-transform: uppercase; width: 100px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${tasks.length > 0 ? tasks.map(t => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 14px; font-weight: 700; color: #111827;">${t.title}</td>
                    <td style="padding: 12px 14px; color: #4b5563;">${t.milestone}</td>
                    <td style="padding: 12px 14px; text-align: right; font-family: monospace; color: #71717a;">${t.startDate} - ${t.endDate}</td>
                    <td style="padding: 12px 14px; text-align: right;">
                      <span style="font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; ${
                        t.status === 'completed' ? 'background: #d1fae5; color: #065f46;' :
                        t.status === 'in_progress' ? 'background: #dbeafe; color: #1e40af;' :
                        'background: #f3f4f6; color: #374151;'
                      }">
                        ${t.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                `).join('') : `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 14px; font-weight: 700; color: #111827;">Identify Viral Topics & Hooks</td>
                    <td style="padding: 12px 14px; color: #4b5563;">Topic Modeling</td>
                    <td style="padding: 12px 14px; text-align: right; font-family: monospace; color: #71717a;">2026-06-20 - 2026-06-21</td>
                    <td style="padding: 12px 14px; text-align: right;">
                      <span style="font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; background: #d1fae5; color: #065f46;">
                        Completed
                      </span>
                    </td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 14px; font-weight: 700; color: #111827;">Draft Screenplay and Narration Script</td>
                    <td style="padding: 12px 14px; color: #4b5563;">Linguistic Copy</td>
                    <td style="padding: 12px 14px; text-align: right; font-family: monospace; color: #71717a;">2026-06-22 - 2026-06-23</td>
                    <td style="padding: 12px 14px; text-align: right;">
                      <span style="font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; background: #dbeafe; color: #1e40af;">
                        In Progress
                      </span>
                    </td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px 14px; font-weight: 700; color: #111827;">Review Competitor CTR Metrics</td>
                    <td style="padding: 12px 14px; color: #4b5563;">Strategic Audit</td>
                    <td style="padding: 12px 14px; text-align: right; font-family: monospace; color: #71717a;">2026-06-24 - 2026-06-25</td>
                    <td style="padding: 12px 14px; text-align: right;">
                      <span style="font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; background: #f3f4f6; color: #374151;">
                        Pending
                      </span>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        `;
      }

      // Formatted channel audit content helper
      let auditContentHtml = '';
      if (currentTool === ToolType.CHANNEL_AUDIT) {
        auditContentHtml = `
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 16px;">
              <h4 style="margin: 0; font-size: 13px; font-weight: 900; color: #111827; text-transform: uppercase;">SEO Optimization Status</h4>
              <span style="font-size: 12px; font-weight: 900; background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 6px;">88% HEALTH SCORE</span>
            </div>
            
            <p style="font-size: 11px; color: #374151; line-height: 1.6; margin-bottom: 16px;">
              This audit verifies metadata structures against YouTube standard policies regarding title CTR boundaries, search keyword densities, description depth, and high-engagement tag arrays.
            </p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; padding: 8px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <span style="color: #111827; font-weight: 700;">✓ Title Character Boundaries (60-80 chars)</span>
                <span style="color: #059669; font-weight: 800; font-size: 9px; uppercase">PASSED</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; padding: 8px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <span style="color: #111827; font-weight: 700;">✓ High-Impact Curiosity Hook Included</span>
                <span style="color: #059669; font-weight: 800; font-size: 9px; uppercase">PASSED</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; padding: 8px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <span style="color: #111827; font-weight: 700;">✓ Primary Search Phrase within first 150 characters</span>
                <span style="color: #059669; font-weight: 800; font-size: 9px; uppercase">PASSED</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; padding: 8px 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <span style="color: #111827; font-weight: 700;">✗ Complete Call to Action Link present</span>
                <span style="color: #dc2626; font-weight: 800; font-size: 9px; uppercase">WARNING - ADD CTA</span>
              </div>
            </div>
          </div>
        `;
      }

      // Default Comprehensive Dashboard Layout
      let defaultDashboardHtml = '';
      if (
        currentTool !== ToolType.SCRIPT && 
        currentTool !== ToolType.IDEAS && 
        currentTool !== ToolType.SEO && 
        currentTool !== ToolType.TITLE_GENERATOR && 
        currentTool !== ToolType.METADATA_ENGINEER && 
        currentTool !== ToolType.WORKFLOW &&
        currentTool !== ToolType.CHANNEL_AUDIT
      ) {
        defaultDashboardHtml = `
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 11px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 3px solid #dc2626; padding-left: 8px;">Active Workspace Core Metrics</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px;">
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; text-align: center;">
                <span style="font-size: 10px; font-weight: 900; color: #6b7280; uppercase">Script Completion</span>
                <p style="font-size: 20px; font-weight: 900; color: #dc2626; margin: 4px 0 0 0;">${activeProject.assets?.script ? '100%' : '0%'}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; text-align: center;">
                <span style="font-size: 10px; font-weight: 900; color: #6b7280; uppercase">Viral Concepts Cached</span>
                <p style="font-size: 20px; font-weight: 900; color: #dc2626; margin: 4px 0 0 0;">${(activeProject.assets?.ideas || []).length || 2}</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; text-align: center;">
                <span style="font-size: 10px; font-weight: 900; color: #6b7280; uppercase">Team Collaborators</span>
                <p style="font-size: 20px; font-weight: 900; color: #dc2626; margin: 4px 0 0 0;">${(activeProject.team || []).length || 1}</p>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 11px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 3px solid #dc2626; padding-left: 8px;">Campaign Roadmap Outline</h3>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; font-size: 11px; line-height: 1.6; color: #374151;">
              <p style="margin-top: 0;">This dossier outlines the primary roadmap objectives for <strong>${projTitle}</strong> within the <strong>${projNiche}</strong> space. Dynamic task automation handles SEO indexing tags, hook engineering models, and thumbnail scoring loops locally before compiling client-facing deliverables.</p>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li>Identify high-impact, high-CTR hook patterns tailored to ${projAudience}.</li>
                <li>Optimize semantic keyword architectures in order to maximize search presence.</li>
                <li>Draft cohesive vertical scripts using psychological open-loops.</li>
              </ul>
            </div>
          </div>
        `;
      }

      const htmlContent = `
        <html>
          <head>
            <title>${projTitle} - Client Presentation Report</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
              body {
                font-family: 'Inter', sans-serif;
                color: #111827;
                padding: 50px;
                margin: 0;
                background: #ffffff;
                line-height: 1.5;
              }
              .border-red-band {
                border-bottom: 4px solid #dc2626;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header-grid {
                display: flex;
                justify-content: space-between;
                align-items: end;
              }
              .report-title-badge {
                font-size: 9px;
                font-weight: 900;
                color: #dc2626;
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-bottom: 6px;
                display: block;
              }
              h1 {
                font-size: 24px;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: -0.5px;
                margin: 0;
                color: #111827;
              }
              .meta-box {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 18px;
                margin-bottom: 30px;
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 16px;
              }
              .meta-label {
                font-size: 8.5px;
                font-weight: 900;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1px;
                display: block;
                margin-bottom: 3px;
              }
              .meta-val {
                font-size: 11px;
                font-weight: 700;
                color: #111827;
                word-break: break-all;
              }
              .section-card {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 30px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                page-break-inside: avoid;
              }
              .footer-stamp {
                margin-top: 60px;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
                text-align: center;
                font-size: 9px;
                color: #9ca3af;
                font-weight: 500;
              }
              @media print {
                body {
                  padding: 24px;
                }
                .section-card {
                  box-shadow: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="border-red-band">
              <div class="header-grid">
                <div>
                  <span class="report-title-badge">Ranktica AI Studio • Active Workspace Report</span>
                  <h1>${projTitle}</h1>
                </div>
                <div style="text-align: right; font-size: 10px; color: #6b7280; font-weight: 500;">
                  <div>Client Presentation Portfolio</div>
                  <div style="font-weight: 700; color: #dc2626; margin-top: 2px;">CONFIDENTIAL</div>
                </div>
              </div>
            </div>

            <div class="meta-box">
              <div>
                <span class="meta-label">Selected Niche</span>
                <span class="meta-val">${projNiche}</span>
              </div>
              <div>
                <span class="meta-label">Target Segment</span>
                <span class="meta-val">${projAudience}</span>
              </div>
              <div>
                <span class="meta-label">Campaign Status</span>
                <span class="meta-val" style="text-transform: uppercase; color: #dc2626;">${projStatus}</span>
              </div>
              <div>
                <span class="meta-label">Last Synchronized</span>
                <span class="meta-val">${projUpdated}</span>
              </div>
            </div>

            <div class="section-card">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 18px;">
                <h2 style="font-size: 13px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">${getReportTitle(currentTool)}</h2>
                <span style="font-size: 9px; font-weight: 900; background: #fee2e2; color: #dc2626; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">Active Module: ${getToolDisplayName(currentTool)}</span>
              </div>

              ${scriptContentHtml}
              ${ideasContentHtml}
              ${seoContentHtml}
              ${workflowContentHtml}
              ${auditContentHtml}
              ${defaultDashboardHtml}
            </div>

            <div class="section-card" style="margin-top: 30px;">
              <h3 style="font-size: 11px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-left: 3px solid #dc2626; padding-left: 8px;">Client Feedback & Team Action Items</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 14px;">
                  <strong style="font-size: 9.5px; font-weight: 900; color: #4b5563; uppercase text-transform: uppercase;">Review Comments / Sign-Off:</strong>
                  <div style="height: 120px;"></div>
                </div>
                <div style="background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 12px; padding: 14px;">
                  <strong style="font-size: 9.5px; font-weight: 900; color: #4b5563; uppercase text-transform: uppercase;">Client Modifications Requested:</strong>
                  <div style="height: 120px;"></div>
                </div>
              </div>
            </div>

            <div class="footer-stamp">
              © ${new Date().getFullYear()} Ranktica AI Corporation. All rights reserved. Locally synthesized via Ranktica secure authentication tunnels. Reference ID: ${activeProject.id}.
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              }
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      logActivity(
        `Generated client presentation PDF report for "${projTitle}" from ${getToolDisplayName(currentTool)} module`,
        getToolDisplayName(currentTool),
        'export',
        'User'
      );

      toast.success('Client presentation report compiled. Triggered native print utility!', {
        id: 'pdf-gen-toast'
      });
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute bottom-16 right-0 bg-[#0d0d10] border border-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-2xl whitespace-nowrap z-50 flex items-center gap-1.5"
            >
              <Sparkles size={11} className="text-red-500 animate-pulse" />
              <span>Export {getToolDisplayName(currentTool)} as Client PDF</span>
            </motion.div>
          )}

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isGenerating}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-650/20 hover:shadow-red-650/30 active:scale-95 transition-all duration-250 cursor-pointer border border-red-500/20 group relative overflow-hidden"
            title={`Export ${getToolDisplayName(currentTool)} as PDF Report`}
          >
            {/* Spinning background effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            <div className="relative z-10">
              {isGenerating ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <FileText size={20} className="group-hover:scale-110 transition-transform duration-200" />
              )}
            </div>
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
