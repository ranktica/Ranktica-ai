import JSZip from 'jszip';
import { Project } from '@/shared/types';

/**
 * Service utility module for handling standardized zip archive generation and downloads 
 * for selected project assets from Ranktica AI.
 */
export const ExportUtility = {
  /**
   * Helper to fetch graphic images or media assets as Blobs for inclusion in the ZIP archive
   */
  async fetchAssetBlob(url: string): Promise<Blob | null> {
    try {
      // Use standard browser fetch with no-referrer
      const response = await fetch(url, { referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.blob();
    } catch (e) {
      console.warn(`[ExportUtility] Skipping remote asset binary fetch due to restrictive CORS policy or connection issues:`, e);
      return null;
    }
  },

  /**
   * Package one or multiple project assets into a single cohesive, structured ZIP archive
   */
  async generateZipBlob(projects: Project[]): Promise<Blob> {
    const zip = new JSZip();

    // Create container folders/structures for cleaner layout
    for (const project of projects) {
      const folderName = `${project.title.replace(/[^a-z0-9_-]/gi, '_') || 'Untitled_Project'}_${project.id}`;
      const prjFolder = zip.folder(folderName);
      if (!prjFolder) continue;

      // 1. Project Manifest metadata summary
      const summaryText = `[RANKTICA AI PROJECT MANIFEST SUMMARY]
=========================================
Project ID: ${project.id}
Title: ${project.title}
Niche: ${project.niche}
Audience: ${project.audience || 'General Audience'}
Status: ${project.status.toUpperCase()}
Last Updated: ${new Date(project.lastUpdated).toLocaleString()}
Joint Collaborators: ${project.team?.join(', ') || 'Only Owner'}
=========================================
`;
      prjFolder.file('summary.txt', summaryText);

      // 2. Script asset
      if (project.assets?.script) {
        prjFolder.file('script.txt', project.assets.script);
      } else {
        prjFolder.file('script.txt', '[System Offline - Script template not generated. Generate a script inside Ranktica Workspace to sync.]');
      }

      // 3. Keyword / SEO / Tags metadata block
      if (project.assets?.seo) {
        const seo = project.assets.seo;
        const seoText = `[RANKTICA AI METADATA & SEO ENGINE OUTLINE]
=========================================
Primary Topic: ${project.title}

TARGET TITLES SUGGESTIONS:
${Array.isArray(seo.titles) ? seo.titles.map((t: string, i: number) => ` [${i + 1}] ${t}`).join('\n') : seo.titles || 'None'}

RECOMMENDED DESCRIPTION COPY:
${seo.description || 'Not generated yet.'}

VIRAL SEARCH TAGS:
${Array.isArray(seo.tags) ? seo.tags.join(', ') : seo.tags || 'None'}

HASHTAGS (INSTAGRAM / SHORTS):
${Array.isArray(seo.hashtags) ? seo.hashtags.join(' ') : seo.hashtags || 'None'}

SEMANTIC CLUSTERS & ENTITIES:
${Array.isArray(seo.semanticClusters) ? seo.semanticClusters.map((c: string) => ` - ${c}`).join('\n') : seo.semanticClusters || 'None'}
=========================================
`;
        prjFolder.file('seo_strategy.txt', seoText);
        prjFolder.file('seo_strategy.json', JSON.stringify(seo, null, 2));
      }

      // 4. Thumbnail Image or details link
      if (project.assets?.thumbnail) {
        const url = project.assets.thumbnail;
        if (url.startsWith('data:image')) {
          // Base64 decoding
          try {
            const parts = url.split(';base64,');
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);
            for (let i = 0; i < rawLength; ++i) {
              uInt8Array[i] = raw.charCodeAt(i);
            }
            prjFolder.file('thumbnail.png', uInt8Array, { binary: true });
          } catch (err) {
            console.error('[ExportUtility] Base64 decoding fail:', err);
            prjFolder.file('thumbnail_source.txt', `Base64 source decode failed. Remote location: ${url}`);
          }
        } else {
          // Remote URL. Try to fetch asset binary, fallback to link file
          const blob = await this.fetchAssetBlob(url);
          if (blob) {
            prjFolder.file('thumbnail.png', blob);
          } else {
            prjFolder.file('thumbnail_source.txt', `Graphic thumbnail located externally to bypass CORS policies:\nUrl: ${url}`);
          }
        }
      }

      // 5. Video asset or Audio details
      if (project.assets?.videoUri) {
        prjFolder.file('synthesized_assets.txt', `Voice Synth Video Link: ${project.assets.videoUri}\nDownload or review live in the Workspace!`);
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  },

  /**
   * Action trigger to execute ZIP consolidation and push download trigger to the browser
   */
  async downloadProjectAssets(projects: Project[], archiveName = 'ranktica-exported-assets'): Promise<void> {
    if (!projects || projects.length === 0) {
      throw new Error('No valid project entries provided for zip export action');
    }

    const mBlob = await this.generateZipBlob(projects);
    const downloadUri = URL.createObjectURL(mBlob);
    
    // Virtual anchor creation to trigger downloads safely under sandboxed frameworks
    const linkAnchor = document.createElement('a');
    linkAnchor.href = downloadUri;
    linkAnchor.download = `${archiveName}-${Date.now()}.zip`;
    document.body.appendChild(linkAnchor);
    linkAnchor.click();
    
    // Standard cleanup
    document.body.removeChild(linkAnchor);
    URL.revokeObjectURL(downloadUri);
  }
};
