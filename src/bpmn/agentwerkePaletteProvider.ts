import { AGENT_TASK_TYPE, APPROVAL_TASK_TYPE, EXTERNAL_EVENT_TYPE } from './constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

function AgentwerkePaletteProvider(
  this: any,
  palette: any,
  create: any,
  elementFactory: any,
  bpmnFactory: any,
  translate: any,
) {
  this._create = create;
  this._elementFactory = elementFactory;
  this._bpmnFactory = bpmnFactory;
  this._translate = translate;

  palette.registerProvider(this);
}

AgentwerkePaletteProvider.$inject = ['palette', 'create', 'elementFactory', 'bpmnFactory', 'translate'];

AgentwerkePaletteProvider.prototype.getPaletteEntries = function () {
  const create = this._create;
  const elementFactory = this._elementFactory;
  const bpmnFactory = this._bpmnFactory;
  const translate = this._translate;

  const buildTask = (bpmnType: string, extensionType: string, defaults: Record<string, unknown>) => {
    const extension = bpmnFactory.create(extensionType, defaults);
    const extensionElements = bpmnFactory.create('bpmn:ExtensionElements', { values: [extension] });
    extension.$parent = extensionElements;

    const businessObject = bpmnFactory.create(bpmnType, { extensionElements });
    extensionElements.$parent = businessObject;

    return elementFactory.createShape({ type: bpmnType, businessObject });
  };

  const buildExternalWaitEvent = () => {
    const extension = bpmnFactory.create(EXTERNAL_EVENT_TYPE, {
      messageName: 'external.event',
      correlationKeyTemplate: '{{input.correlation_key}}',
    });
    const extensionElements = bpmnFactory.create('bpmn:ExtensionElements', { values: [extension] });
    extension.$parent = extensionElements;

    const messageEventDefinition = bpmnFactory.create('bpmn:MessageEventDefinition');
    const businessObject = bpmnFactory.create('bpmn:IntermediateCatchEvent', {
      eventDefinitions: [messageEventDefinition],
      extensionElements,
    });
    extensionElements.$parent = businessObject;
    messageEventDefinition.$parent = businessObject;

    return elementFactory.createShape({ type: 'bpmn:IntermediateCatchEvent', businessObject });
  };

  const startAgentTask = (event: any) => {
    create.start(
      event,
      buildTask('bpmn:ServiceTask', AGENT_TASK_TYPE, {
        agent: 'analyst',
        action: 'analyze',
        purposeType: 'analysis',
        policyTag: 'standard',
        executionMode: 'local',
      }),
    );
  };

  const startApprovalTask = (event: any) => {
    create.start(
      event,
      buildTask('bpmn:UserTask', APPROVAL_TASK_TYPE, {
        purposeType: 'human-approval',
        policyTag: 'standard',
      }),
    );
  };

  const startExternalWait = (event: any) => {
    create.start(event, buildExternalWaitEvent());
  };

  return {
    'agentwerke-separator': {
      group: 'agentwerke',
      separator: true,
    },
    'agentwerke-agent-task': {
      group: 'agentwerke',
      className: 'bpmn-icon-service-task agentwerke-palette-agent',
      title: translate('Create Agent Task'),
      action: {
        dragstart: startAgentTask,
        click: startAgentTask,
      },
    },
    'agentwerke-approval-task': {
      group: 'agentwerke',
      className: 'bpmn-icon-user-task agentwerke-palette-approval',
      title: translate('Create Approval Gate'),
      action: {
        dragstart: startApprovalTask,
        click: startApprovalTask,
      },
    },
    'agentwerke-external-wait': {
      group: 'agentwerke',
      className: 'bpmn-icon-intermediate-event-catch-message',
      title: translate('Create External Wait'),
      action: {
        dragstart: startExternalWait,
        click: startExternalWait,
      },
    },
  };
};

export const AgentwerkePaletteModule = {
  __init__: ['agentwerkePaletteProvider'],
  agentwerkePaletteProvider: ['type', AgentwerkePaletteProvider],
};
