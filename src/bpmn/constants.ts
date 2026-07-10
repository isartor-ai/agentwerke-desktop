export const AGENTWERKE_NS_PREFIX = 'agentwerke';
export const AGENTWERKE_NS_URI = 'https://agentwerke.de/bpmn/extensions/v1';

export const AGENT_TASK_TYPE = 'agentwerke:AgentTask';
export const APPROVAL_TASK_TYPE = 'agentwerke:ApprovalTask';
export const EXTERNAL_EVENT_TYPE = 'agentwerke:ExternalEvent';
export const PROMPT_TYPE = 'agentwerke:Prompt';

export function createEmptyDiagram(processId = 'Process_1'): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:${AGENTWERKE_NS_PREFIX}="${AGENTWERKE_NS_URI}"
                  id="Definitions_1"
                  targetNamespace="https://agentwerke.de/bpmn">
  <bpmn:process id="${processId}" name="Untitled Agentwerke Workflow" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
