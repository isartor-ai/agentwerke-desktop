import { contextBridge, ipcRenderer } from 'electron';

export interface BpmnFileResult {
  canceled: boolean;
  filePath?: string;
  fileName?: string;
  content?: string;
}

export type DesktopMenuCommand = 'new' | 'open' | 'save' | 'save-as' | 'validate' | 'deploy' | 'check-server';

contextBridge.exposeInMainWorld('agentwerkeDesktop', {
  openBpmn: () => ipcRenderer.invoke('bpmn:open') as Promise<BpmnFileResult>,
  saveBpmn: (filePath: string | undefined, content: string) =>
    ipcRenderer.invoke('bpmn:save', { filePath, content }) as Promise<BpmnFileResult>,
  saveBpmnAs: (content: string) =>
    ipcRenderer.invoke('bpmn:save-as', { content }) as Promise<BpmnFileResult>,
  setDirty: (dirty: boolean) => ipcRenderer.send('bpmn:dirty-changed', dirty),
  onMenuCommand: (callback: (command: DesktopMenuCommand) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: DesktopMenuCommand) => callback(command);
    ipcRenderer.on('desktop-menu-command', listener);
    return () => ipcRenderer.removeListener('desktop-menu-command', listener);
  },
  openHelp: () => ipcRenderer.invoke('help:open') as Promise<void>,
});
