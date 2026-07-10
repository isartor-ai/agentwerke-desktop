import type { SelectedElementMetadata } from '../types';

interface MetadataPanelProps {
  selection: SelectedElementMetadata | null;
  onPromptChange(prompt: string): void;
}

export function MetadataPanel({ selection, onPromptChange }: MetadataPanelProps) {
  if (!selection) {
    return (
      <section className="side-section" aria-label="Selection">
        <h2>Selection</h2>
        <p className="muted">Select one BPMN element.</p>
      </section>
    );
  }

  return (
    <section className="side-section" aria-label="Selection">
      <h2>Selection</h2>
      <dl className="meta-list">
        <div>
          <dt>ID</dt>
          <dd>{selection.elementId}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{selection.bpmnType.replace('bpmn:', '')}</dd>
        </div>
      </dl>

      {selection.agentTask ? (
        <div className="metadata-block">
          <h3>Agent Task</h3>
          <dl className="meta-list">
            <div>
              <dt>Agent</dt>
              <dd>{selection.agentTask.agent ?? 'Unset'}</dd>
            </div>
            <div>
              <dt>Action</dt>
              <dd>{selection.agentTask.action ?? 'Unset'}</dd>
            </div>
            <div>
              <dt>Policy</dt>
              <dd>{selection.agentTask.policyTag ?? 'Unset'}</dd>
            </div>
          </dl>
          <label className="field">
            <span>Prompt</span>
            <textarea
              rows={7}
              value={selection.agentTask.prompt ?? ''}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="Instructions for this agent step"
            />
          </label>
        </div>
      ) : null}

      {selection.approvalTask ? (
        <div className="metadata-block">
          <h3>Approval Gate</h3>
          <dl className="meta-list">
            <div>
              <dt>Purpose</dt>
              <dd>{selection.approvalTask.purposeType ?? 'Unset'}</dd>
            </div>
            <div>
              <dt>Policy</dt>
              <dd>{selection.approvalTask.policyTag ?? 'Unset'}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {selection.externalEvent ? (
        <div className="metadata-block">
          <h3>External Wait</h3>
          <dl className="meta-list">
            <div>
              <dt>Message</dt>
              <dd>{selection.externalEvent.messageName ?? 'Unset'}</dd>
            </div>
            <div>
              <dt>Correlation</dt>
              <dd>{selection.externalEvent.correlationKeyTemplate ?? 'Unset'}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}
