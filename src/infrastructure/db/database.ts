
import { secureStorage } from '@/shared/secureStorage';

export const db = {
  /**
   * Syncs a project to the backend database (and mirrors to secure storage as fallback)
   */
  saveProject: async (project: any) => {
    console.debug("[Ranktica DB] Syncing project manifest to core database...", project.id);
    
    // Fallback/Local persistence sync mirror via encrypted Storage
    const saved = await secureStorage.getItem('ranktica_projects');
    const projects = saved ? JSON.parse(saved) : [];
    const idx = projects.findIndex((p: any) => p.id === project.id);
    if (idx > -1) projects[idx] = project;
    else projects.push(project);
    await secureStorage.setItem('ranktica_projects', JSON.stringify(projects));

    try {
      const response = await fetch('/api/db/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      return true;
    } catch (err) {
      console.warn("[Ranktica DB] Server sync failed, operating on secure Encrypted storage state:", err);
      return true;
    }
  },

  /**
   * Fetches all projects from the backend database with fallback to mirror
   */
  getProjects: async () => {
    console.debug("[Ranktica DB] Pulling project manifests...");
    
    try {
      const response = await fetch('/api/db/projects');
      if (response.ok) {
        const data = await response.json();
        // Update secure local cache sync
        await secureStorage.setItem('ranktica_projects', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn("[Ranktica DB] Could not reach backend, loading from persistent secure IndexedDB cache:", err);
    }

    const saved = await secureStorage.getItem('ranktica_projects');
    return saved ? JSON.parse(saved) : [];
  },

  /**
   * Deletes a project from the backend database with fallback to cache mirror
   */
  deleteProject: async (id: string) => {
    // Cache clear first
    const saved = await secureStorage.getItem('ranktica_projects');
    if (saved) {
      const projects = JSON.parse(saved).filter((p: any) => p.id !== id);
      await secureStorage.setItem('ranktica_projects', JSON.stringify(projects));
    }

    try {
      await fetch(`/api/db/projects/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn("[Ranktica DB] Could not send delete signal to server:", err);
    }
  }
};

