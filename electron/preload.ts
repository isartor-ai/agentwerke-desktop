import { contextBridge, ipcRenderer } from 'electron';

export interface BpmnFileResult {
  canceled: boolean;
  filePath?: string;
  fileName?: string;
  content?: string;
}

contextBridge.exposeInMainWorld('agentwerkeDesktop', {
  openBpmn: () => ipcRenderer.invoke('bpmn:open') as Promise<BpmnFileResult>,
  saveBpmn: (filePath: string | undefined, content: string) =>
    ipcRenderer.invoke('bpmn:save', { filePath, content }) as Promise<BpmnFileResult>,
  saveBpmnAs: (content: string) =>
    ipcRenderer.invoke('bpmn:save-as', { content }) as Promise<BpmnFileResult>,
});
