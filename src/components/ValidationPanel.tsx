import type { WorkflowValidationResult } from '../types';

interface ValidationPanelProps {
  validation: WorkflowValidationResult | null;
  busy: boolean;
  message: string | null;
}

export function ValidationPanel({ validation, busy, message }: ValidationPanelProps) {
  return (
    <section className="side-section" aria-label="Validation and publish status">
      <h2>Status</h2>
      {busy ? <p className="muted">Working...</p> : null}
      {message ? <p className="status-message">{message}</p> : null}
      {!validation ? <p className="muted">No validation result.</p> : null}
      {validation ? (
        <div className="validation-summary">
          <span className={`pill ${validation.isValid ? 'pill-ok' : 'pill-error'}`}>
            {validation.isValid ? 'Valid' : 'Invalid'}
          </span>
          <span>{validation.errors.length} errors</span>
          <span>{validation.warnings.length} warnings</span>
        </div>
      ) : null}
      {validation?.errors.length ? (
        <div className="issue-list">
          <h3>Errors</h3>
          {validation.errors.map((issue, index) => (
            <article key={`${issue.elementId ?? 'document'}-${index}`} className="issue issue-error">
              <strong>{issue.elementId ?? issue.elementName ?? 'document'}</strong>
              <p>{issue.message}</p>
            </article>
          ))}
        </div>
      ) : null}
      {validation?.warnings.length ? (
        <div className="issue-list">
          <h3>Warnings</h3>
          {validation.warnings.map((issue, index) => (
            <article key={`${issue.elementId ?? 'document'}-${index}`} className="issue issue-warning">
              <strong>{issue.elementId ?? issue.elementName ?? 'document'}</strong>
              <p>{issue.message}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
