import { AGENT_TASK_TYPE, APPROVAL_TASK_TYPE, EXTERNAL_EVENT_TYPE } from './constants';
import { getExtension } from './properties/extensionUtil';

/* eslint-disable @typescript-eslint/no-explicit-any */

const AGENT_MARKER = 'agentwerke-agent-task';
const APPROVAL_MARKER = 'agentwerke-approval-task';
const EXTERNAL_MARKER = 'agentwerke-external-event';

function AgentwerkeMarkers(this: any, eventBus: any, canvas: any, elementRegistry: any) {
  const refresh = () => {
    elementRegistry.forEach((element: any) => {
      if (!element?.businessObject) {
        return;
      }

      const hasAgent = Boolean(getExtension(element, AGENT_TASK_TYPE));
      const hasApproval = Boolean(getExtension(element, APPROVAL_TASK_TYPE));
      const hasExternal = Boolean(getExtension(element, EXTERNAL_EVENT_TYPE));

      canvas.removeMarker(element, AGENT_MARKER);
      canvas.removeMarker(element, APPROVAL_MARKER);
      canvas.removeMarker(element, EXTERNAL_MARKER);

      if (hasAgent) {
        canvas.addMarker(element, AGENT_MARKER);
      }
      if (hasApproval) {
        canvas.addMarker(element, APPROVAL_MARKER);
      }
      if (hasExternal) {
        canvas.addMarker(element, EXTERNAL_MARKER);
      }
    });
  };

  eventBus.on('import.done', refresh);
  eventBus.on('commandStack.changed', refresh);
}

AgentwerkeMarkers.$inject = ['eventBus', 'canvas', 'elementRegistry'];

export const AgentwerkeMarkersModule = {
  __init__: ['agentwerkeMarkers'],
  agentwerkeMarkers: ['type', AgentwerkeMarkers],
};
