/// <reference types="vite/client" />

import type { BpmnFileResult, DesktopMenuCommand } from '../electron/preload';

declare global {
  interface Window {
    agentwerkeDesktop?: {
      openBpmn(): Promise<BpmnFileResult>;
      saveBpmn(filePath: string | undefined, content: string): Promise<BpmnFileResult>;
      saveBpmnAs(content: string): Promise<BpmnFileResult>;
      setDirty(dirty: boolean): void;
      onMenuCommand(callback: (command: DesktopMenuCommand) => void): () => void;
      openHelp(): Promise<void>;
    };
  }
}
