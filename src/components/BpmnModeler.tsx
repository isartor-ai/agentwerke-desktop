import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Modeler from 'bpmn-js/lib/Modeler';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import { agentwerkeModdleDescriptor } from '../bpmn/agentwerkeModdle';
import { agentwerkeModules } from '../bpmn/agentwerkeModule';
import { AGENTWERKE_NS_PREFIX, AGENT_TASK_TYPE, APPROVAL_TASK_TYPE, EXTERNAL_EVENT_TYPE } from '../bpmn/constants';
import { ensureDiagramInterchange } from '../bpmn/layout';
import { getExtension, getPromptBody, setPromptBody } from '../bpmn/properties/extensionUtil';
import type { SelectedElementMetadata, ValidationIssue } from '../types';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import '@bpmn-io/properties-panel/dist/assets/properties-panel.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

const CHANGE_DEBOUNCE_MS = 250;
const VALIDATION_MARKER = 'agentwerke-validation-error';

export interface BpmnModelerHandle {
  getXML(): Promise<string>;
  importXML(xml: string): Promise<void>;
  updateSelectedAgentPrompt(prompt: string): void;
}

interface BpmnModelerProps {
  initialXml: string;
  validationErrors: ValidationIssue[];
  onChange(xml: string): void;
  onError(message: string): void;
  onSelectionChange(selection: SelectedElementMetadata | null): void;
}

function readAttribute(extension: any | undefined, name: string): string | undefined {
  const value = extension?.get ? extension.get(name) : extension?.[name];
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

function describeSelection(element: any): SelectedElementMetadata | null {
  if (!element?.businessObject) {
    return null;
  }

  const businessObject = getBusinessObject(element);
  const agentTask = getExtension(element, AGENT_TASK_TYPE);
  const approvalTask = getExtension(element, APPROVAL_TASK_TYPE);
  const externalEvent = getExtension(element, EXTERNAL_EVENT_TYPE);

  return {
    elementId: businessObject.id,
    elementName: businessObject.name || businessObject.id,
    bpmnType: businessObject.$type,
    agentTask: agentTask
      ? {
          agent: readAttribute(agentTask, 'agent'),
          action: readAttribute(agentTask, 'action'),
          purposeType: readAttribute(agentTask, 'purposeType'),
          policyTag: readAttribute(agentTask, 'policyTag'),
          prompt: getPromptBody(agentTask),
        }
      : undefined,
    approvalTask: approvalTask
      ? {
          purposeType: readAttribute(approvalTask, 'purposeType'),
          policyTag: readAttribute(approvalTask, 'policyTag'),
        }
      : undefined,
    externalEvent: externalEvent
      ? {
          messageName: readAttribute(externalEvent, 'messageName'),
          correlationKeyTemplate: readAttribute(externalEvent, 'correlationKeyTemplate'),
        }
      : undefined,
  };
}

export const BpmnModeler = forwardRef<BpmnModelerHandle, BpmnModelerProps>(function BpmnModeler(
  { initialXml, validationErrors, onChange, onError, onSelectionChange },
  ref,
) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const modelerRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  const onErrorRef = useRef(onError);
  const onSelectionChangeRef = useRef(onSelectionChange);

  onChangeRef.current = onChange;
  onErrorRef.current = onError;
  onSelectionChangeRef.current = onSelectionChange;

  const emitSelection = () => {
    const modeler = modelerRef.current;
    if (!modeler) {
      onSelectionChangeRef.current(null);
      return;
    }

    const selection = modeler.get('selection').get();
    onSelectionChangeRef.current(selection.length === 1 ? describeSelection(selection[0]) : null);
  };

  const importIntoModeler = async (xml: string) => {
    const modeler = modelerRef.current;
    if (!modeler) {
      return;
    }

    try {
      const xmlWithLayout = await ensureDiagramInterchange(xml);
      modeler.clear();
      await modeler.importXML(xmlWithLayout);
      modeler.get('canvas').zoom('fit-viewport');
      emitSelection();
    } catch (error) {
      onErrorRef.current(error instanceof Error ? error.message : 'Failed to import BPMN XML.');
    }
  };

  useImperativeHandle(ref, () => ({
    async getXML() {
      if (!modelerRef.current) {
        return '';
      }
      const { xml } = await modelerRef.current.saveXML({ format: true });
      return xml ?? '';
    },
    importXML: importIntoModeler,
    updateSelectedAgentPrompt(prompt: string) {
      const modeler = modelerRef.current;
      if (!modeler) {
        return;
      }

      const selection = modeler.get('selection').get();
      if (selection.length !== 1) {
        return;
      }

      const modeling = modeler.get('modeling');
      const moddle = modeler.get('moddle');
      setPromptBody(selection[0], AGENT_TASK_TYPE, prompt, { modeling, moddle });
      emitSelection();
    },
  }), []);

  useEffect(() => {
    if (!canvasRef.current || !panelRef.current) {
      return;
    }

    const modeler = new Modeler({
      container: canvasRef.current,
      propertiesPanel: { parent: panelRef.current },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        ...agentwerkeModules,
      ],
      moddleExtensions: {
        [AGENTWERKE_NS_PREFIX]: agentwerkeModdleDescriptor,
      },
      keyboard: { bindTo: document },
    });

    modelerRef.current = modeler;

    const emitChange = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const { xml } = await modeler.saveXML({ format: true });
          onChangeRef.current(xml ?? '');
          emitSelection();
        } catch {
          // Serialization can fail briefly while a command is still being applied.
        }
      }, CHANGE_DEBOUNCE_MS);
    };

    modeler.on('commandStack.changed', emitChange);
    modeler.on('selection.changed', emitSelection);
    void importIntoModeler(initialXml);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      modeler.destroy();
      modelerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const modeler = modelerRef.current;
    if (!modeler) {
      return;
    }

    let overlays: any;
    let elementRegistry: any;
    let canvas: any;
    try {
      overlays = modeler.get('overlays');
      elementRegistry = modeler.get('elementRegistry');
      canvas = modeler.get('canvas');
    } catch {
      return;
    }

    overlays.clear();
    elementRegistry.forEach((element: any) => canvas.removeMarker(element, VALIDATION_MARKER));

    for (const issue of validationErrors) {
      if (!issue.elementId) {
        continue;
      }
      const element = elementRegistry.get(issue.elementId);
      if (!element) {
        continue;
      }
      canvas.addMarker(element, VALIDATION_MARKER);
      const badge = document.createElement('div');
      badge.className = 'validation-overlay';
      badge.textContent = issue.message;
      overlays.add(issue.elementId, {
        position: { bottom: -6, left: 0 },
        html: badge,
      });
    }
  }, [validationErrors]);

  return (
    <div className="modeler">
      <div className="modeler-canvas" ref={canvasRef} aria-label="BPMN canvas" />
      <aside className="modeler-properties" ref={panelRef} aria-label="BPMN properties" />
    </div>
  );
});
