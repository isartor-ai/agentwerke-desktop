import type { ImportWorkflowResponse, PublishWorkflowResponse, ServerSettings, WorkflowValidationResult } from '../types';

function apiBaseUrl(settings: ServerSettings): string {
  return settings.baseUrl.trim().replace(/\/+$/, '');
}

async function requestJson<T>(
  settings: ServerSettings,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (settings.token.trim()) {
    headers.set('Authorization', `Bearer ${settings.token.trim()}`);
  }

  const response = await fetch(`${apiBaseUrl(settings)}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    let message = body || `${response.status} ${response.statusText}`;
    try {
      const json = JSON.parse(body) as { message?: string; errors?: string[] };
      message = [json.message, ...(json.errors ?? [])].filter(Boolean).join(' ');
    } catch {
      // Use the raw response text.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function validateWorkflow(
  settings: ServerSettings,
  bpmnXml: string,
): Promise<WorkflowValidationResult> {
  return requestJson<WorkflowValidationResult>(settings, '/api/workflows/validate', {
    method: 'POST',
    body: JSON.stringify({ bpmnXml }),
  });
}

export async function importWorkflow(
  settings: ServerSettings,
  fileName: string,
  bpmnXml: string,
): Promise<ImportWorkflowResponse> {
  return requestJson<ImportWorkflowResponse>(settings, '/api/workflows/import', {
    method: 'POST',
    body: JSON.stringify({
      fileName,
      bpmnXml,
      description: 'Authored in Agentwerke Desktop',
      tags: ['desktop'],
    }),
  });
}

export async function publishWorkflow(
  settings: ServerSettings,
  workflowId: string,
  bpmnXml: string,
): Promise<PublishWorkflowResponse> {
  return requestJson<PublishWorkflowResponse>(settings, `/api/workflows/${encodeURIComponent(workflowId)}/publish`, {
    method: 'POST',
    body: JSON.stringify({
      bpmnXml,
      description: 'Published from Agentwerke Desktop',
      tags: ['desktop'],
    }),
  });
}

export async function checkServer(settings: ServerSettings): Promise<void> {
  await requestJson(settings, '/api/health/live');
}
