import { AGENTWERKE_NS_URI } from './constants';

export interface AgentwerkeXmlInspection {
  processName: string;
  hasAgentwerkeNamespace: boolean;
  agentTaskCount: number;
  approvalTaskCount: number;
  externalEventCount: number;
  promptCount: number;
  errors: string[];
}

function parserError(document: Document): string | null {
  return document.querySelector('parsererror')?.textContent?.trim() ?? null;
}

function firstProcessName(document: Document): string {
  const process = Array.from(document.getElementsByTagName('*')).find(
    (element) => element.localName === 'process',
  );
  return process?.getAttribute('name') || process?.getAttribute('id') || 'Untitled workflow';
}

export function inspectAgentwerkeXml(xml: string): AgentwerkeXmlInspection {
  if (!xml.trim()) {
    return {
      processName: 'Untitled workflow',
      hasAgentwerkeNamespace: false,
      agentTaskCount: 0,
      approvalTaskCount: 0,
      externalEventCount: 0,
      promptCount: 0,
      errors: ['BPMN XML is empty.'],
    };
  }

  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const error = parserError(document);
  if (error) {
    return {
      processName: 'Invalid BPMN XML',
      hasAgentwerkeNamespace: false,
      agentTaskCount: 0,
      approvalTaskCount: 0,
      externalEventCount: 0,
      promptCount: 0,
      errors: [error],
    };
  }

  const root = document.documentElement;
  const hasAgentwerkeNamespace = root.lookupNamespaceURI('agentwerke') === AGENTWERKE_NS_URI;

  return {
    processName: firstProcessName(document),
    hasAgentwerkeNamespace,
    agentTaskCount: document.getElementsByTagNameNS(AGENTWERKE_NS_URI, 'agentTask').length,
    approvalTaskCount: document.getElementsByTagNameNS(AGENTWERKE_NS_URI, 'approvalTask').length,
    externalEventCount: document.getElementsByTagNameNS(AGENTWERKE_NS_URI, 'externalEvent').length,
    promptCount: document.getElementsByTagNameNS(AGENTWERKE_NS_URI, 'prompt').length,
    errors: [],
  };
}
