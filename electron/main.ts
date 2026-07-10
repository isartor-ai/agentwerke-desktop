import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

interface BpmnFileResult {
  canceled: boolean;
  filePath?: string;
  fileName?: string;
  content?: string;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    title: 'Agentwerke Desktop',
    backgroundColor: '#f5f7fb',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    void window.loadFile(join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('bpmn:open', async (): Promise<BpmnFileResult> => {
  const result = await dialog.showOpenDialog({
    title: 'Open BPMN workflow',
    properties: ['openFile'],
    filters: [{ name: 'BPMN workflow', extensions: ['bpmn', 'xml'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  const content = await readFile(filePath, 'utf8');

  return {
    canceled: false,
    filePath,
    fileName: filePath.split(/[\\/]/).pop(),
    content,
  };
});

ipcMain.handle('bpmn:save', async (_event, payload: { filePath?: string; content: string }): Promise<BpmnFileResult> => {
  let filePath = payload.filePath;

  if (!filePath) {
    const result = await dialog.showSaveDialog({
      title: 'Save BPMN workflow',
      defaultPath: 'workflow.bpmn',
      filters: [{ name: 'BPMN workflow', extensions: ['bpmn'] }],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    filePath = result.filePath;
  }

  await writeFile(filePath, payload.content, 'utf8');

  return {
    canceled: false,
    filePath,
    fileName: filePath.split(/[\\/]/).pop(),
    content: payload.content,
  };
});

ipcMain.handle('bpmn:save-as', async (_event, payload: { content: string }): Promise<BpmnFileResult> => {
  const result = await dialog.showSaveDialog({
    title: 'Save BPMN workflow as',
    defaultPath: 'workflow.bpmn',
    filters: [{ name: 'BPMN workflow', extensions: ['bpmn'] }],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await writeFile(result.filePath, payload.content, 'utf8');

  return {
    canceled: false,
    filePath: result.filePath,
    fileName: result.filePath.split(/[\\/]/).pop(),
    content: payload.content,
  };
});
