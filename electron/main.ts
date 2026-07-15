import { app, BrowserWindow, dialog, ipcMain, Menu, shell, type MenuItemConstructorOptions } from 'electron';
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

type DesktopMenuCommand = 'new' | 'open' | 'save' | 'save-as' | 'validate' | 'deploy' | 'check-server';

const helpUrl = 'https://github.com/isartor-ai/agentwerke-desktop#readme';
const mainWindows = new Set<BrowserWindow>();
const windowDirtyState = new WeakMap<BrowserWindow, boolean>();
const closeConfirmedWindows = new WeakSet<BrowserWindow>();

function sendMenuCommand(command: DesktopMenuCommand) {
  const targetWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  targetWindow?.webContents.send('desktop-menu-command', command);
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin';
  const fileMenu: MenuItemConstructorOptions = {
    label: 'File',
    submenu: [
      { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => sendMenuCommand('new') },
      { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => sendMenuCommand('open') },
      { type: 'separator' },
      { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => sendMenuCommand('save') },
      { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendMenuCommand('save-as') },
      { type: 'separator' },
      ...(isMac
        ? [
            { label: 'Close Window', accelerator: 'CmdOrCtrl+W', role: 'close' } satisfies MenuItemConstructorOptions,
            { label: 'Quit Agentwerke Desktop', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
          ]
        : [{ role: 'quit' } satisfies MenuItemConstructorOptions]),
    ],
  };

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' } satisfies MenuItemConstructorOptions] : []),
    fileMenu,
    {
      label: 'Deploy To',
      submenu: [
        { label: 'Validate Workflow', accelerator: 'CmdOrCtrl+Shift+V', click: () => sendMenuCommand('validate') },
        { label: 'Agentwerke', accelerator: 'CmdOrCtrl+Shift+D', click: () => sendMenuCommand('deploy') },
        { type: 'separator' },
        { label: 'Check Agentwerke API', click: () => sendMenuCommand('check-server') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Agentwerke Desktop Help', accelerator: 'F1', click: () => void shell.openExternal(helpUrl) },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
  mainWindows.add(window);

  window.on('close', (event) => {
    if (closeConfirmedWindows.has(window) || !windowDirtyState.get(window)) {
      return;
    }

    event.preventDefault();
    const choice = dialog.showMessageBoxSync(window, {
      type: 'warning',
      buttons: ['Cancel', 'Close Without Saving'],
      defaultId: 0,
      cancelId: 0,
      title: 'Unsaved BPMN changes',
      message: 'Close Agentwerke Desktop?',
      detail: 'This workflow has unsaved BPMN changes. Close without saving?',
      noLink: true,
    });

    if (choice === 1) {
      closeConfirmedWindows.add(window);
      window.close();
    }
  });

  window.on('closed', () => {
    mainWindows.delete(window);
    closeConfirmedWindows.delete(window);
    windowDirtyState.delete(window);

    if (mainWindows.size === 0) {
      app.quit();
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    void window.loadFile(join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createApplicationMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.handle('app:quit', () => {
  app.quit();
});

ipcMain.on('bpmn:dirty-changed', (event, dirty: boolean) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    windowDirtyState.set(window, Boolean(dirty));
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

ipcMain.handle('help:open', async (): Promise<void> => {
  await shell.openExternal(helpUrl);
});
