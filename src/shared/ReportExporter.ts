import { jsPDF } from 'jspdf';
import { Project } from '@/shared/types';

export interface ReportData {
  project: {
    id: string;
    title: string;
    niche: string;
    audience: string;
    status: string;
    lastUpdated: string;
    team: string[];
  };
  activeAssets: {
    script: string;
    titles: string[];
    description: string;
    tags: string[];
    hashtags: string[];
    semanticClusters: string[];
  };
  scriptHistory: Array<{
    id: string;
    label: string;
    timestamp: string;
    content: string;
  }>;
  titleHistory: Array<{
    id: string;
    label: string;
    timestamp: string;
    title: string;
  }>;
  auditTrail: any[];
}

/**
 * High-fidelity, client-side PDF and JSON document history report compiler
 */
export const ReportExporter = {
  /**
   * Generates a fully compiled, structured JSON document containing all histories and metadata
   */
  compileReportData(project: Project, historyLogs: any[]): ReportData {
    // Filter audit logs for this project
    const projectLogs = historyLogs.filter(log => {
      const pId = log.metadata?.projectId || log.metadata?.project_id;
      if (pId === project.id) return true;
      const metadataTitle = log.metadata?.title;
      if (metadataTitle && metadataTitle === project.title) return true;
      if (log.action && log.action.toLowerCase().includes(project.title.toLowerCase())) return true;
      return false;
    });

    return {
      project: {
        id: project.id,
        title: project.title,
        niche: project.niche,
        audience: project.audience || 'General Audience',
        status: project.status,
        lastUpdated: new Date(project.lastUpdated).toLocaleString(),
        team: project.team || []
      },
      activeAssets: {
        script: project.assets?.script || 'No active script draft.',
        titles: project.assets?.seo?.titles || [],
        description: project.assets?.seo?.description || 'No SEO description generated.',
        tags: project.assets?.seo?.tags || [],
        hashtags: project.assets?.seo?.hashtags || [],
        semanticClusters: project.assets?.seo?.semanticClusters || []
      },
      scriptHistory: (project.assets?.scriptHistory || []).map(v => ({
        id: v.id,
        label: v.label || 'Script Version',
        timestamp: new Date(v.timestamp).toLocaleString(),
        content: v.content
      })),
      titleHistory: (project.assets?.titleHistory || []).map(v => ({
        id: v.id,
        label: v.label || 'Title Version',
        timestamp: new Date(v.timestamp).toLocaleString(),
        title: v.title
      })),
      auditTrail: projectLogs.map(l => ({
        timestamp: new Date(l.timestamp).toLocaleString(),
        type: l.type || 'State',
        action: l.action,
        metadata: l.metadata || {}
      }))
    };
  },

  /**
   * Triggers browser download of custom formatted JSON history file
   */
  exportAsJson(project: Project, historyLogs: any[]): void {
    const data = this.compileReportData(project, historyLogs);
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_history_report.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Compiles and downloads a multi-page, formatted PDF detailing all histories and logs
   */
  exportAsPdf(project: Project, historyLogs: any[]): void {
    const report = this.compileReportData(project, historyLogs);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let currentY = 20;
    const pageHeight = 297;
    const marginX = 20;
    const contentWidth = 170;

    // Helper to print text and handle page breaks
    const addText = (text: string, fontSize: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [39, 39, 42], spacing = 6) => {
      doc.setFont('helvetica', style);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      
      const lines = doc.splitTextToSize(text, contentWidth);
      const neededSpace = lines.length * (fontSize * 0.35) + spacing;
      
      if (currentY + neededSpace > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
        
        // Print header on new pages
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170);
        doc.text(`Ranktica AI • Project History File: ${report.project.title}`, marginX, 10);
        doc.line(marginX, 12, marginX + contentWidth, 12);
        currentY = 20;
        
        doc.setFont('helvetica', style);
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
      }
      
      doc.text(lines, marginX, currentY);
      currentY += neededSpace;
    };

    const addDivider = () => {
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.5);
      doc.line(marginX, currentY, marginX + contentWidth, currentY);
      currentY += 8;
    };

    // PAGE 1: TITLE & METADATA SUMMARY
    addText('RANKTICA AI — CREATIVE REPORT', 10, 'bold', [239, 68, 68], 6);
    addText('PROJECT HISTORY & PRODUCTION MANIFEST', 20, 'bold', [24, 24, 27], 8);
    addText(`Report Compiled: ${new Date().toLocaleString()}`, 9, 'normal', [113, 113, 122], 12);
    addDivider();

    addText('1. PROJECT DIRECTORY METADATA', 12, 'bold', [24, 24, 27], 6);
    addText(`Title: ${report.project.title}`, 10, 'bold', [39, 39, 42], 5);
    addText(`Niche Segment: ${report.project.niche}`, 10, 'normal', [39, 39, 42], 5);
    addText(`Target Audience: ${report.project.audience}`, 10, 'normal', [39, 39, 42], 5);
    addText(`Workflow Status: ${report.project.status.toUpperCase()}`, 10, 'bold', [217, 70, 239], 5);
    addText(`Joint Collaborators: ${report.project.team.join(', ') || 'Only Workspace Owner'}`, 10, 'normal', [39, 39, 42], 5);
    addText(`Last Database Sync: ${report.project.lastUpdated}`, 10, 'normal', [39, 39, 42], 12);
    addDivider();

    // ACTIVE SEO METADATA
    addText('2. CURRENT METADATA STRATEGY', 12, 'bold', [24, 24, 27], 6);
    
    if (report.activeAssets.titles.length > 0) {
      addText('Generated Title Variations:', 10, 'bold', [39, 39, 42], 4);
      report.activeAssets.titles.forEach((t, i) => {
        addText(`  [${i + 1}] ${t}`, 9.5, 'normal', [63, 63, 70], 4);
      });
      currentY += 3;
    }

    addText('Description Draft:', 10, 'bold', [39, 39, 42], 4);
    addText(report.activeAssets.description, 9.5, 'normal', [63, 63, 70], 6);

    if (report.activeAssets.tags.length > 0) {
      addText(`Search SEO Tags: ${report.activeAssets.tags.join(', ')}`, 9.5, 'normal', [63, 63, 70], 5);
    }
    if (report.activeAssets.hashtags.length > 0) {
      addText(`Platform Hashtags: ${report.activeAssets.hashtags.join(' ')}`, 9.5, 'normal', [63, 63, 70], 5);
    }
    if (report.activeAssets.semanticClusters.length > 0) {
      addText(`Semantic Entities Cluster: ${report.activeAssets.semanticClusters.join(', ')}`, 9.5, 'normal', [63, 63, 70], 5);
    }
    
    currentY += 8;
    addDivider();

    // SCRIPT CONTENT OR HISTORY
    addText('3. ARCHIVED SCREENPLAY SCRIPTS', 12, 'bold', [24, 24, 27], 6);
    if (report.scriptHistory.length === 0) {
      addText('Current Active Screenplay Script:', 11, 'bold', [39, 39, 42], 4);
      addText(report.activeAssets.script, 9.5, 'normal', [63, 63, 70], 6);
    } else {
      addText(`Detected ${report.scriptHistory.length} historical script drafts saved to project:`, 10, 'normal', [113, 113, 122], 6);
      report.scriptHistory.forEach((sh, index) => {
        addText(`${sh.label} (${sh.timestamp})`, 10.5, 'bold', [24, 24, 27], 4);
        
        // Print first 500 characters or complete content
        const previewText = sh.content.length > 700 
          ? sh.content.slice(0, 700) + '\n... [Script truncated for report compilation limits. Open Ranktica editor to review entirety] ...'
          : sh.content;
        addText(previewText, 9, 'normal', [63, 63, 70], 8);
        currentY += 4;
      });
    }

    currentY += 4;
    addDivider();

    // AUDIT LOGS
    addText('4. HISTORICAL ACTIVITY LEDGER & AUDIT TRAIL', 12, 'bold', [24, 24, 27], 6);
    if (report.auditTrail.length === 0) {
      addText('Void history trail. No actions detected in log ledgers.', 10, 'normal', [113, 113, 122], 6);
    } else {
      report.auditTrail.forEach((log) => {
        addText(`[${log.timestamp}] [${log.type}] ${log.action}`, 9, 'normal', [63, 63, 70], 4);
      });
    }

    // Trigger Download
    doc.save(`${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_compiled_history.pdf`);
  }
};
