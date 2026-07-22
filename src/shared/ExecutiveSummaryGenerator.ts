import { jsPDF } from 'jspdf';
import { Project } from '@/shared/types';
import { getAiClient } from '@/infrastructure/gemini';
import { MODEL_NAMES } from '@/shared/constants';

export const ExecutiveSummaryGenerator = {
  /**
   * Compiles the project data and calls Gemini to generate a professional, structured executive alignment summary.
   */
  async generateSummaryText(project: Project): Promise<string> {
    const ai = getAiClient();
    
    // Gather project content
    const title = project.title;
    const niche = project.niche;
    const audience = project.audience || 'General Creators';
    const status = project.status || 'draft';
    const scriptPreview = project.assets?.script 
      ? project.assets.script.substring(0, 1500) 
      : 'No script screenplay drafted yet.';
    
    // Gather milestons / tasks content if any
    const tasks = project.assets?.tasks || [];
    const taskSummary = tasks.length > 0 
      ? tasks.map((t: any) => `- [${t.status === 'completed' ? 'X' : ' '}] ${t.title} (Milestone: ${t.milestone || 'General'} - Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'TBD'})`).join('\n')
      : 'No structural milestones or Gantt tasks registered in the workspace yet.';

    const prompt = `You are the Lead Creative Strategist & Director at Ranktica AI. Generate a professional, highly structured executive progress alignment summary for a YouTube production workspace.
    
    Project Title: "${title}"
    Niche segment: ${niche}
    Target audience: ${audience}
    Overall status: ${status.toUpperCase()}
    
    Current Milestones & Tasks:
    ${taskSummary}
    
    Script Draft Preview:
    """
    ${scriptPreview}
    """
    
    Please provide an detailed, engaging, and professional executive assessment. Format it strictly with the following four distinct sections. Be concise, strategic, and direct:
    
    SECTION 1: 📌 EXECUTIVE BRIEFING ANALYSIS
    (A high-level synthesis summarizing the project's brand voice, overall direction, and current status momentum. Max 3-4 sentences.)
    
    SECTION 2: 🏆 RECENT MILESTONES & PROGRESS ACCOMPLISHED
    (3 bulleted highlights of key achievements, milestones reached, or content pacing strengths found in the script draft. Begin each with a dynamic emoji.)
    
    SECTION 3: 📅 UPCOMING DEADLINES & STRATEGIC RECOMMENDATIONS
    (3 actionable bullets outlining critical upcoming tasks, scheduled deadlines, or narrative recommendations to drive higher CTR/viewer retention.)
    
    SECTION 4: 💡 CRITICAL WORKFLOW CRITIQUE & NEXT STEPS
    (A professional creative feedback note summarizing the strategic trajectory and necessary immediate steps for team synchronization.)`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAMES.TEXT_SMART,
        contents: prompt
      });
      return response.text || 'Failed to synthesize executive summary text.';
    } catch (error) {
      console.error('[ExecutiveSummaryGenerator] Gemini call failed:', error);
      throw new Error('Could not compile executive briefing text. Please verify Gemini configurations in workspace.');
    }
  },

  /**
   * Triggers generation and builds an ultra-slick, modern, high-contrast PDF document for immediate download.
   */
  async buildAndDownloadPdf(project: Project): Promise<void> {
    const summaryText = await this.generateSummaryText(project);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageHeight = 297;
    const marginX = 20;
    const contentWidth = 170;
    let currentY = 15;

    // Helper to add text and handle wrap with page boundaries
    const addText = (text: string, fontSize: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [39, 39, 42], spacing = 5) => {
      doc.setFont('helvetica', style);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      const neededSpace = lines.length * (fontSize * 0.35) + spacing;
      
      if (currentY + neededSpace > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
        
        // Header on new pages
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170);
        doc.text(`Ranktica AI • Executive Alignment Brief • Project: ${project.title}`, marginX, 10);
        doc.line(marginX, 12, marginX + contentWidth, 12);
        currentY = 20;
        
        doc.setFont('helvetica', style);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
      }
      
      doc.text(lines, marginX, currentY);
      currentY += neededSpace;
    };

    const drawSectionHeader = (title: string) => {
      if (currentY + 15 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFillColor(244, 63, 94, 0.05); // light pink-rose background
      doc.rect(marginX, currentY, contentWidth, 7, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(225, 29, 72); // rose red brand accent
      doc.text(title, marginX + 3, currentY + 5);
      
      currentY += 11;
    };

    // TOP DESIGN BLOCK: Dark header board
    doc.setFillColor(24, 24, 27); // Zinc 900
    doc.rect(15, currentY, 180, 26, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(244, 63, 94); // Rose 500
    doc.text('RANKTICA AI — AUTONOMOUS CREATOR PLATFORM', marginX, currentY + 7);
    
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('EXECUTIVE ALIGNMENT BRIEFING', marginX, currentY + 16);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(161, 161, 170);
    doc.text(`Compiled: ${new Date().toLocaleString()}`, marginX, currentY + 22);

    currentY += 34;

    // PROJECT INFO CARD OVERVIEW
    addText(`Project Directory Target: ${project.title}`, 12, 'bold', [24, 24, 27], 6);
    
    doc.setFillColor(228, 228, 231);
    doc.rect(marginX, currentY, contentWidth, 0.5, 'F');
    currentY += 4;

    // Key stats labels
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text('NICHE SEGMENT', marginX, currentY);
    doc.text('WORKFLOW STATUS', marginX + 60, currentY);
    doc.text('COLLABORATORS', marginX + 110, currentY);

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text(project.niche, marginX, currentY);
    doc.text(project.status.toUpperCase(), marginX + 60, currentY);
    doc.text(`${project.team ? project.team.length : 0} Members`, marginX + 110, currentY);

    currentY += 10;
    doc.setFillColor(228, 228, 231);
    doc.rect(marginX, currentY, contentWidth, 0.5, 'F');
    currentY += 8;

    // PARSE SECTIONS FROM GEMINI TEXT
    const sections = summaryText.split(/SECTION \d+:/i);
    
    // Clean and associate sections
    const getCleanSectionText = (idx: number): string => {
      if (idx >= sections.length) return '';
      // Strip title lines (e.g. " EXECUTIVE BRIEFING ANALYSIS")
      const lines = sections[idx].trim().split('\n');
      if (lines.length > 0 && lines[0].toUpperCase().includes('ANALYSIS') || lines[0].toUpperCase().includes('PROGRESS') || lines[0].toUpperCase().includes('RECOMMENDATIONS') || lines[0].toUpperCase().includes('WORKFLOW')) {
        lines.shift();
      }
      return lines.join('\n').trim();
    };

    const briefingText = getCleanSectionText(1) || 'No assessment briefing compiled.';
    const progressText = getCleanSectionText(2) || 'No progress metrics listed.';
    const deadlinesText = getCleanSectionText(3) || 'No deadlines compiled.';
    const critiqueText = getCleanSectionText(4) || 'No workflow critique finalized.';

    // RENDER BRIEFING SECTION
    drawSectionHeader('1. EXECUTIVE ANALYSIS BRIEFING');
    addText(briefingText, 10, 'normal', [39, 39, 42], 8);

    // RENDER PROGRESS SECTION
    drawSectionHeader('2. RECENT SUCCESS & MILESTONES SECURED');
    addText(progressText, 9.5, 'normal', [39, 39, 42], 8);

    // RENDER RECOMMENDATIONS SECTION
    drawSectionHeader('3. TARGET UPCOMING DEADLINES & FORECAST RECOMMENDATIONS');
    addText(deadlinesText, 9.5, 'normal', [39, 39, 42], 8);

    // RENDER CRITIQUE SECTION
    drawSectionHeader('4. WORKFLOW CRITIQUE & ACTION RECOMMENDATIONS');
    addText(critiqueText, 10, 'normal', [39, 39, 42], 12);

    // FOOTER DESIGN PATTERN
    if (pageHeight - currentY < 25) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY = pageHeight - 30;
    }
    
    doc.setFillColor(228, 228, 231);
    doc.rect(marginX, currentY, contentWidth, 0.5, 'F');
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(161, 161, 170);
    doc.text('This executive brief details automated optimization recommendations developed through Ranktica Autonomous Core synthesis.', marginX, currentY);
    doc.text('© Ranktica Global AI Workspace. All intellectual assets encrypted server-side.', marginX, currentY + 3.5);

    // Download PDF
    doc.save(`${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_executive_alignment.pdf`);
  }
};
