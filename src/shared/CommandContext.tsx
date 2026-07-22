import React, { createContext, useContext, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface Command {
  id: string;
  tool: 'Script Writer' | 'Idea Generator' | 'Thumbnail Studio';
  label: string;
  timestamp: number;
  undo: () => void;
  redo: () => void;
}

export interface BatchOperation {
  id: string;
  type: 'generate_idea' | 'write_script' | 'create_thumbnail';
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface MacroAction {
  id: string;
  type: 'navigate' | 'ai_call';
  target: string; // ToolType or 'generate_idea' etc.
  label: string;
}

export interface KeyboardMacro {
  id: string;
  name: string;
  shortcutKey: string; // e.g., 'm', '1', etc.
  actions: MacroAction[];
}

interface CommandContextType {
  undoStack: Command[];
  redoStack: Command[];
  canUndo: boolean;
  canRedo: boolean;
  registerCommand: (
    tool: 'Script Writer' | 'Idea Generator' | 'Thumbnail Studio',
    label: string,
    undo: () => void,
    redo: () => void
  ) => void;
  executeCommand: (
    tool: 'Script Writer' | 'Idea Generator' | 'Thumbnail Studio',
    label: string,
    undo: () => void,
    redo: () => void
  ) => void;
  undo: () => void;
  redo: () => void;
  undoMultiple: (count: number) => void;
  redoMultiple: (count: number) => void;
  clearHistory: () => void;
  
  // Batch queue execution
  queue: BatchOperation[];
  addToQueue: (type: 'generate_idea' | 'write_script' | 'create_thumbnail', label: string) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  executeBatch: (activeProject: any, updateActiveProject: any) => Promise<void>;
  isExecuting: boolean;
  currentRunningIndex: number;

  // Keyboard macros recording and execution
  isRecordingMacro: boolean;
  recordedActions: MacroAction[];
  macros: KeyboardMacro[];
  startRecordingMacro: () => void;
  recordMacroAction: (type: 'navigate' | 'ai_call', target: string, label: string) => void;
  saveRecordedMacro: (name: string, shortcutKey: string) => void;
  cancelRecordingMacro: () => void;
  deleteMacro: (id: string) => void;
  executeMacro: (macro: KeyboardMacro, onNavigate: (tool: any) => void, updateActiveProject: any, activeProject: any) => Promise<void>;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export const useCommand = () => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider');
  }
  return context;
};

export const CommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [undoStack, setUndoStack] = useState<Command[]>([]);
  const [redoStack, setRedoStack] = useState<Command[]>([]);
  
  // Queue state
  const [queue, setQueue] = useState<BatchOperation[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRunningIndex, setCurrentRunningIndex] = useState(-1);

  const registerCommand = useCallback(
    (
      tool: 'Script Writer' | 'Idea Generator' | 'Thumbnail Studio',
      label: string,
      undo: () => void,
      redo: () => void
    ) => {
      const newCommand: Command = {
        id: Math.random().toString(36).substring(2, 9),
        tool,
        label,
        timestamp: Date.now(),
        undo,
        redo,
      };

      setUndoStack((prev) => [newCommand, ...prev].slice(0, 50)); // Keep history capped to recent 50 commands
      setRedoStack([]); // Clean up redo when new action occurs
    },
    []
  );

  const executeCommand = useCallback(
    (
      tool: 'Script Writer' | 'Idea Generator' | 'Thumbnail Studio',
      label: string,
      undo: () => void,
      redo: () => void
    ) => {
      redo(); // Run the action first
      registerCommand(tool, label, undo, redo);
    },
    [registerCommand]
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const [cmd, ...remainingUndo] = undoStack;
    
    try {
      cmd.undo();
      setUndoStack(remainingUndo);
      setRedoStack((prev) => [cmd, ...prev]);
    } catch (err) {
      console.error('[Undo Command Failure]:', err);
    }
  }, [undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const [cmd, ...remainingRedo] = redoStack;

    try {
      cmd.redo();
      setRedoStack(remainingRedo);
      setUndoStack((prev) => [cmd, ...prev]);
    } catch (err) {
      console.error('[Redo Command Failure]:', err);
    }
  }, [redoStack]);

  const undoMultiple = useCallback((count: number) => {
    if (undoStack.length === 0 || count <= 0) return;
    const actualCount = Math.min(count, undoStack.length);
    const toUndo = undoStack.slice(0, actualCount);
    const remainingUndo = undoStack.slice(actualCount);

    try {
      for (const cmd of toUndo) {
        cmd.undo();
      }
      setUndoStack(remainingUndo);
      setRedoStack((prev) => [...toUndo, ...prev]);
    } catch (err) {
      console.error('[Batch Undo Failure]:', err);
    }
  }, [undoStack]);

  const redoMultiple = useCallback((count: number) => {
    if (redoStack.length === 0 || count <= 0) return;
    const actualCount = Math.min(count, redoStack.length);
    const toRedo = redoStack.slice(0, actualCount);
    const remainingRedo = redoStack.slice(actualCount);

    try {
      for (const cmd of toRedo) {
        cmd.redo();
      }
      setRedoStack(remainingRedo);
      setUndoStack((prev) => [...toRedo, ...prev]);
    } catch (err) {
      console.error('[Batch Redo Failure]:', err);
    }
  }, [redoStack]);

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  // Batch command management
  const addToQueue = useCallback((type: 'generate_idea' | 'write_script' | 'create_thumbnail', label: string) => {
    const newOp: BatchOperation = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      label,
      status: 'pending'
    };
    setQueue((prev) => [...prev, newOp]);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter(op => op.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setIsExecuting(false);
    setCurrentRunningIndex(-1);
  }, []);

  const executeBatch = useCallback(async (activeProject: any, updateActiveProject: any) => {
    if (queue.length === 0 || !activeProject) {
      return;
    }

    setIsExecuting(true);
    const updatedQueue = queue.map(op => ({ ...op, status: 'pending' as const, error: undefined }));
    setQueue(updatedQueue);

    for (let i = 0; i < updatedQueue.length; i++) {
      setCurrentRunningIndex(i);
      setQueue(prev => prev.map((op, idx) => idx === i ? { ...op, status: 'running' as const } : op));

      const operation = updatedQueue[i];
      try {
        if (operation.type === 'generate_idea') {
          const { generateIdeas } = await import('../infrastructure/gemini');
          const niche = activeProject.niche || 'technology';
          const ideas = await generateIdeas(niche, 3);
          
          await updateActiveProject({
            assets: {
              ...(activeProject.assets || {}),
              ideas: [...(activeProject.assets?.ideas || []), ...ideas]
            }
          });
        } else if (operation.type === 'write_script') {
          const { generateScript } = await import('../infrastructure/gemini');
          const title = activeProject.assets?.ideas?.[0]?.title || activeProject.title || 'Viral Video Concept';
          const scriptContent = await generateScript(title, 'engaging', 'explainer', 'Draft a professional video script on this topic');
          
          await updateActiveProject({
            assets: {
              ...(activeProject.assets || {}),
              script: scriptContent
            }
          });
        } else if (operation.type === 'create_thumbnail') {
          const { generateThumbnail } = await import('../infrastructure/gemini');
          const title = activeProject.title || 'Viral Video Concept';
          const thumbnailUri = await generateThumbnail(title, 'cinematic', 'fast', '16:9');
          
          await updateActiveProject({
            assets: {
              ...(activeProject.assets || {}),
              thumbnail: thumbnailUri,
              thumbnailDraft: thumbnailUri
            }
          });
        }

        setQueue(prev => prev.map((op, idx) => idx === i ? { ...op, status: 'completed' as const } : op));
      } catch (err: any) {
        console.error(`[Batch execution failed at index ${i}]:`, err);
        setQueue(prev => prev.map((op, idx) => idx === i ? { ...op, status: 'failed' as const, error: err.message || 'Execution error' } : op));
        setIsExecuting(false);
        throw err;
      }
    }

    setIsExecuting(false);
    setCurrentRunningIndex(-1);
  }, [queue]);

  // Keyboard macros state and helpers
  const [isRecordingMacro, setIsRecordingMacro] = useState(false);
  const [recordedActions, setRecordedActions] = useState<MacroAction[]>([]);
  const [macros, setMacros] = useState<KeyboardMacro[]>(() => {
    try {
      const saved = localStorage.getItem('ranktica_macros');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const startRecordingMacro = useCallback(() => {
    setIsRecordingMacro(true);
    setRecordedActions([]);
    try {
      toast.success("Recording macro started! Every navigation and AI tool call is now tracked.");
    } catch (e) {}
  }, []);

  const recordMacroAction = useCallback((type: 'navigate' | 'ai_call', target: string, label: string) => {
    // We want to be able to record, but only append if recording is active
    setIsRecordingMacro(active => {
      if (active) {
        const newAction: MacroAction = {
          id: Math.random().toString(36).substring(2, 9),
          type,
          target,
          label
        };
        setRecordedActions(prev => {
          if (prev.length > 0 && prev[prev.length - 1].type === type && prev[prev.length - 1].target === target) {
            return prev;
          }
          return [...prev, newAction];
        });
      }
      return active;
    });
  }, []);

  const saveRecordedMacro = useCallback((name: string, shortcutKey: string) => {
    if (recordedActions.length === 0) {
      toast.error("Cannot save empty macro. Please perform some actions first.");
      return;
    }
    const newMacro: KeyboardMacro = {
      id: Math.random().toString(36).substring(2, 9),
      name: name || `Macro #${macros.length + 1}`,
      shortcutKey: shortcutKey.toLowerCase() || 'm',
      actions: recordedActions
    };
    
    setMacros(prev => {
      const updated = [newMacro, ...prev];
      localStorage.setItem('ranktica_macros', JSON.stringify(updated));
      return updated;
    });
    setIsRecordingMacro(false);
    setRecordedActions([]);
    toast.success(`Macro "${newMacro.name}" saved! Use Alt+${newMacro.shortcutKey.toUpperCase()} to play.`);
  }, [recordedActions, macros]);

  const cancelRecordingMacro = useCallback(() => {
    setIsRecordingMacro(false);
    setRecordedActions([]);
    toast.error("Macro recording cancelled.");
  }, []);

  const deleteMacro = useCallback((id: string) => {
    setMacros(prev => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem('ranktica_macros', JSON.stringify(updated));
      return updated;
    });
    toast.success("Macro deleted.");
  }, []);

  const executeMacro = useCallback(async (
    macro: KeyboardMacro,
    onNavigate: (tool: any) => void,
    updateActiveProject: any,
    activeProject: any
  ) => {
    toast.dismiss();
    const macroToast = toast.loading(`Executing macro "${macro.name}"...`);
    
    try {
      for (let i = 0; i < macro.actions.length; i++) {
        const action = macro.actions[i];
        toast.loading(`[Macro] Step ${i + 1}/${macro.actions.length}: ${action.label}...`, { id: macroToast });
        
        if (action.type === 'navigate') {
          onNavigate(action.target);
        } else if (action.type === 'ai_call') {
          if (action.target === 'generate_idea') {
            const { generateIdeas } = await import('../infrastructure/gemini');
            const niche = activeProject?.niche || 'technology';
            const ideas = await generateIdeas(niche, 3);
            
            await updateActiveProject({
              assets: {
                ...(activeProject?.assets || {}),
                ideas: [...(activeProject?.assets?.ideas || []), ...ideas]
              }
            });
          } else if (action.target === 'write_script') {
            const { generateScript } = await import('../infrastructure/gemini');
            const title = activeProject?.assets?.ideas?.[0]?.title || activeProject?.title || 'Viral Video Concept';
            const scriptContent = await generateScript(title, 'engaging', 'explainer', 'Draft a professional video script on this topic');
            
            await updateActiveProject({
              assets: {
                ...(activeProject?.assets || {}),
                script: scriptContent
              }
            });
          } else if (action.target === 'create_thumbnail') {
            const { generateThumbnail } = await import('../infrastructure/gemini');
            const title = activeProject?.title || 'Viral Video Concept';
            const thumbnailUri = await generateThumbnail(title, 'cinematic', 'fast', '16:9');
            
            await updateActiveProject({
              assets: {
                ...(activeProject?.assets || {}),
                thumbnail: thumbnailUri,
                thumbnailDraft: thumbnailUri
              }
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      toast.success(`Macro "${macro.name}" completed successfully! 🚀`, { id: macroToast });
    } catch (err: any) {
      console.error('[Macro Execution Failure]:', err);
      toast.error(`Macro failed at step: ${err.message || err}`, { id: macroToast });
    }
  }, []);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return (
    <CommandContext.Provider
      value={{
        undoStack,
        redoStack,
        canUndo,
        canRedo,
        registerCommand,
        executeCommand,
        undo,
        redo,
        undoMultiple,
        redoMultiple,
        clearHistory,
        
        queue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        executeBatch,
        isExecuting,
        currentRunningIndex,

        // Macros
        isRecordingMacro,
        recordedActions,
        macros,
        startRecordingMacro,
        recordMacroAction,
        saveRecordedMacro,
        cancelRecordingMacro,
        deleteMacro,
        executeMacro
      }}
    >
      {children}
    </CommandContext.Provider>
  );
};
