import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { checkServer, importWorkflow, publishWorkflow, validateWorkflow } from './api/agentwerkeClient';
import { createEmptyDiagram } from './bpmn/constants';
import { inspectAgentwerkeXml } from './bpmn/xmlMetadata';
import { BpmnModeler, type BpmnModelerHandle } from './components/BpmnModeler';
import { MetadataPanel } from './components/MetadataPanel';
import { ValidationPanel } from './components/ValidationPanel';
import type { SelectedElementMetadata, ServerSettings, WorkflowValidationResult } from './types';

const SETTINGS_KEY = 'agentwerke.desktop.serverSettings';

function loadSettings(): ServerSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw) as ServerSettings;
    }
  } catch {
    // Fall through to defaults.
  }

  return {
    baseUrl: 'http://localhost:8081',
    token: '',
  };
}

function fileNameFromPath(path?: string | null): string {
  if (!path) {
    return 'Untitled workflow.bpmn';
  }
  return path.split(/[\\/]/).pop() || 'workflow.bpmn';
}

function closeMenu(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.closest('details')?.removeAttribute('open');
}

export function App() {
  const modelerRef = useRef<BpmnModelerHandle | null>(null);
  const [xml, setXml] = useState(() => createEmptyDiagram());
  const [filePath, setFilePath] = useState<string | undefined>();
  const [fileName, setFileName] = useState('Untitled workflow.bpmn');
  const [dirty, setDirty] = useState(false);
  const [settings, setSettings] = useState<ServerSettings>(() => loadSettings());
  const [validation, setValidation] = useState<WorkflowValidationResult | null>(null);
  const [selection, setSelection] = useState<SelectedElementMetadata | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>('Ready');

  const inspection = useMemo(() => inspectAgentwerkeXml(xml), [xml]);
  const canUseDesktopFiles = Boolean(window.agentwerkeDesktop);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const getCurrentXml = async () => {
    const current = (await modelerRef.current?.getXML()) ?? xml;
    setXml(current);
    return current;
  };

  const confirmDiscard = () => !dirty || window.confirm('Discard unsaved BPMN changes?');

  const handleNew = async () => {
    if (!confirmDiscard()) {
      return;
    }
    const nextXml = createEmptyDiagram();
    await modelerRef.current?.importXML(nextXml);
    setXml(nextXml);
    setFilePath(undefined);
    setFileName('Untitled workflow.bpmn');
    setValidation(null);
    setDirty(false);
    setMessage('Created new workflow');
  };

  const handleOpen = async () => {
    if (!window.agentwerkeDesktop || !confirmDiscard()) {
      return;
    }

    const result = await window.agentwerkeDesktop.openBpmn();
    if (result.canceled || !result.content) {
      return;
    }

    await modelerRef.current?.importXML(result.content);
    setXml(result.content);
    setFilePath(result.filePath);
    setFileName(result.fileName ?? fileNameFromPath(result.filePath));
    setValidation(null);
    setDirty(false);
    setMessage(`Opened ${result.fileName ?? 'BPMN file'}`);
  };

  const handleSave = async () => {
    const current = await getCurrentXml();
    if (!window.agentwerkeDesktop) {
      const blob = new Blob([current], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setDirty(false);
      setMessage('Downloaded BPMN file');
      return;
    }

    const result = await window.agentwerkeDesktop.saveBpmn(filePath, current);
    if (result.canceled) {
      return;
    }

    setFilePath(result.filePath);
    setFileName(result.fileName ?? fileNameFromPath(result.filePath));
    setDirty(false);
    setMessage(`Saved ${result.fileName ?? 'BPMN file'}`);
  };

  const handleSaveAs = async () => {
    const current = await getCurrentXml();
    if (!window.agentwerkeDesktop) {
      await handleSave();
      return;
    }

    const result = await window.agentwerkeDesktop.saveBpmnAs(current);
    if (result.canceled) {
      return;
    }

    setFilePath(result.filePath);
    setFileName(result.fileName ?? fileNameFromPath(result.filePath));
    setDirty(false);
    setMessage(`Saved ${result.fileName ?? 'BPMN file'}`);
  };

  const handleValidate = async () => {
    setBusy(true);
    setMessage('Validating BPMN with Agentwerke...');
    try {
      const current = await getCurrentXml();
      const result = await validateWorkflow(settings, current);
      setValidation(result);
      setMessage(result.isValid ? 'Validation passed' : 'Validation returned errors');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Validation failed');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    setMessage('Deploying workflow to Agentwerke...');
    try {
      const current = await getCurrentXml();
      const validationResult = await validateWorkflow(settings, current);
      setValidation(validationResult);
      if (!validationResult.isValid) {
        setMessage('Publish blocked by validation errors');
        return;
      }

      const imported = await importWorkflow(settings, fileName, current);
      if (!imported.validation.isValid) {
        setValidation(imported.validation);
        setMessage('Import completed but publish blocked by validation errors');
        return;
      }

      const published = await publishWorkflow(settings, imported.workflowId, current);
      setDirty(false);
      setMessage(`Deployed ${published.workflowId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Deploy failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckServer = async () => {
    setBusy(true);
    setMessage('Checking Agentwerke API...');
    try {
      await checkServer(settings);
      setMessage('Agentwerke API is reachable');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Agentwerke API check failed');
    } finally {
      setBusy(false);
    }
  };

  const handlePromptChange = (prompt: string) => {
    modelerRef.current?.updateSelectedAgentPrompt(prompt);
    setSelection((current) => current?.agentTask
      ? { ...current, agentTask: { ...current.agentTask, prompt } }
      : current);
    setDirty(true);
  };

  const handleHelp = async () => {
    if (window.agentwerkeDesktop) {
      await window.agentwerkeDesktop.openHelp();
    } else {
      window.open('https://github.com/isartor-ai/agentwerke-desktop#readme', '_blank', 'noopener,noreferrer');
    }
    setMessage('Opened help');
  };

  const runMenuAction = (event: MouseEvent<HTMLButtonElement>, action: () => void | Promise<void>) => {
    closeMenu(event);
    void action();
  };

  useEffect(() => {
    if (!window.agentwerkeDesktop?.onMenuCommand) {
      return undefined;
    }

    return window.agentwerkeDesktop.onMenuCommand((command) => {
      if (busy && (command === 'validate' || command === 'deploy' || command === 'check-server')) {
        return;
      }

      if (command === 'new') {
        void handleNew();
      } else if (command === 'open') {
        void handleOpen();
      } else if (command === 'save') {
        void handleSave();
      } else if (command === 'save-as') {
        void handleSaveAs();
      } else if (command === 'validate') {
        void handleValidate();
      } else if (command === 'deploy') {
        void handlePublish();
      } else if (command === 'check-server') {
        void handleCheckServer();
      }
    });
  });

  return (
    <main className="app-shell">
      <nav className="app-menu" aria-label="Application menu">
        <details className="menu-item">
          <summary>File</summary>
          <div className="menu-panel">
            <button type="button" onClick={(event) => runMenuAction(event, handleNew)}>New</button>
            <button type="button" onClick={(event) => runMenuAction(event, handleOpen)} disabled={!canUseDesktopFiles}>Open...</button>
            <button type="button" onClick={(event) => runMenuAction(event, handleSave)}>Save</button>
            <button type="button" onClick={(event) => runMenuAction(event, handleSaveAs)} disabled={!canUseDesktopFiles}>Save As...</button>
          </div>
        </details>

        <details className="menu-item">
          <summary>Deploy To</summary>
          <div className="menu-panel">
            <button type="button" onClick={(event) => runMenuAction(event, handleValidate)} disabled={busy}>Validate Workflow</button>
            <button type="button" onClick={(event) => runMenuAction(event, handlePublish)} disabled={busy}>Agentwerke</button>
            <button type="button" onClick={(event) => runMenuAction(event, handleCheckServer)} disabled={busy}>Check Agentwerke API</button>
          </div>
        </details>

        <details className="menu-item">
          <summary>Help</summary>
          <div className="menu-panel">
            <button type="button" onClick={(event) => runMenuAction(event, handleHelp)}>Agentwerke Desktop Help</button>
          </div>
        </details>
      </nav>

      <header className="app-header">
        <div>
          <h1>Agentwerke Desktop</h1>
          <p>{fileName}{dirty ? ' *' : ''}</p>
        </div>
        <nav className="toolbar" aria-label="File and deployment actions">
          <button type="button" onClick={() => void handleNew()}>New</button>
          <button type="button" onClick={() => void handleOpen()} disabled={!canUseDesktopFiles}>Open</button>
          <button type="button" onClick={() => void handleSave()}>Save</button>
          <button type="button" onClick={() => void handleSaveAs()} disabled={!canUseDesktopFiles}>Save As</button>
          <button type="button" onClick={() => void handleValidate()} disabled={busy}>Validate</button>
          <button type="button" className="primary" onClick={() => void handlePublish()} disabled={busy}>Deploy</button>
        </nav>
      </header>

      <section className="workspace">
        <aside className="left-panel">
          <section className="side-section" aria-label="Agentwerke server">
            <h2>Agentwerke API</h2>
            <label className="field">
              <span>Base URL</span>
              <input
                value={settings.baseUrl}
                onChange={(event) => setSettings((current) => ({ ...current, baseUrl: event.target.value }))}
                placeholder="http://localhost:8081"
              />
            </label>
            <label className="field">
              <span>Token</span>
              <input
                value={settings.token}
                type="password"
                onChange={(event) => setSettings((current) => ({ ...current, token: event.target.value }))}
                placeholder="Bearer token"
              />
            </label>
            <button type="button" onClick={() => void handleCheckServer()} disabled={busy}>Check</button>
          </section>

          <section className="side-section" aria-label="BPMN metadata summary">
            <h2>Diagram</h2>
            <dl className="meta-list">
              <div>
                <dt>Process</dt>
                <dd>{inspection.processName}</dd>
              </div>
              <div>
                <dt>Agent tasks</dt>
                <dd>{inspection.agentTaskCount}</dd>
              </div>
              <div>
                <dt>Approvals</dt>
                <dd>{inspection.approvalTaskCount}</dd>
              </div>
              <div>
                <dt>External waits</dt>
                <dd>{inspection.externalEventCount}</dd>
              </div>
              <div>
                <dt>Prompts</dt>
                <dd>{inspection.promptCount}</dd>
              </div>
            </dl>
            {!inspection.hasAgentwerkeNamespace ? (
              <p className="warning-text">Missing Agentwerke namespace.</p>
            ) : null}
          </section>

          <ValidationPanel validation={validation} busy={busy} message={message} />
        </aside>

        <BpmnModeler
          ref={modelerRef}
          initialXml={xml}
          validationErrors={validation?.errors ?? []}
          onChange={(nextXml) => {
            setXml(nextXml);
            setDirty(true);
          }}
          onError={setMessage}
          onSelectionChange={setSelection}
        />

        <aside className="right-panel">
          <MetadataPanel selection={selection} onPromptChange={handlePromptChange} />
        </aside>
      </section>
    </main>
  );
}
