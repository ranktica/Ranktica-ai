import { Project } from '@/shared/types';

/**
 * Report Generation & Document Export Engine
 */

export const exportProjectToMarkdown = (project: Project): string => {
  const assets = project.assets || {};
  const seo = assets.seo || { titles: [], description: '', tags: [], hashtags: [] };

  return `# RANKTICA AI MANIFEST: ${project.title}
Generated: ${new Date(project.lastUpdated).toLocaleDateString()}
Niche: ${project.niche}
Target Audience: ${project.audience || 'General Audience'}
Project Status: ${project.status.toUpperCase()}

---

## 🚀 VIRAL HEADLINES / TITLES
${seo.titles?.map((t, idx) => `${idx + 1}. ${t}`).join('\n') || 'No titles optimized yet'}

---

## 📝 PRODUCTION SCRIPT READY
${assets.script || '*Write and optimize a high-retention script to display it here.*'}

---

## 🔍 SEMANTIC METADATA & SEO STRATEGY
### Description
\`\`\`text
${seo.description || 'No description crafted.'}
\`\`\`

### Optimized Search Tags
${seo.tags?.map(t => `#${t.replace(/\s+/g, '')}`).join(' ') || 'None generated.'}

### Social Hashtags
${seo.hashtags?.join(' ') || 'None generated.'}

---
*Created with Ranktica Autonomous YouTube Suite*
`;
};

export const exportProjectToCSV = (project: Project): string => {
  const headers = ['Project Title', 'Niche', 'Audience', 'Metadata Title Count', 'Has Script'];
  const data = [
    `"${project.title.replace(/"/g, '""')}"`,
    `"${project.niche.replace(/"/g, '""')}"`,
    `"${(project.audience || 'General').replace(/"/g, '""')}"`,
    project.assets?.seo?.titles?.length || 0,
    project.assets?.script ? 'YES' : 'NO'
  ];

  return [headers.join(','), data.join(',')].join('\n');
};
