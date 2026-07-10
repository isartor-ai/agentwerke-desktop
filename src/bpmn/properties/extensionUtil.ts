import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import { PROMPT_TYPE } from '../constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ModdleServices {
  modeling: any;
  moddle: any;
}

export function getExtension(element: any, type: string): any | undefined {
  const businessObject = getBusinessObject(element);
  const values = businessObject?.extensionElements?.values;
  if (!values) {
    return undefined;
  }
  return values.find((value: any) => value.$type === type);
}

export function getExtensionProperty(element: any, type: string, property: string): string {
  const extension = getExtension(element, type);
  const value = extension?.get ? extension.get(property) : extension?.[property];
  return value === undefined || value === null ? '' : String(value);
}

export function setExtensionProperty(
  element: any,
  type: string,
  properties: Record<string, unknown>,
  { modeling, moddle }: ModdleServices,
): void {
  const businessObject = getBusinessObject(element);

  let extensionElements = businessObject.extensionElements;
  if (!extensionElements) {
    extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] });
    extensionElements.$parent = businessObject;
    modeling.updateModdleProperties(element, businessObject, { extensionElements });
  }

  let extension = (extensionElements.values || []).find((value: any) => value.$type === type);
  if (!extension) {
    extension = moddle.create(type, {});
    extension.$parent = extensionElements;
    modeling.updateModdleProperties(element, extensionElements, {
      values: [...(extensionElements.values || []), extension],
    });
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(properties)) {
    normalized[key] = raw === '' ? undefined : raw;
  }

  modeling.updateModdleProperties(element, extension, normalized);
}

export function getPromptBody(agentTask: any | undefined): string {
  const prompt = agentTask?.prompt;
  if (!prompt) {
    return '';
  }
  if (Array.isArray(prompt)) {
    return prompt[0]?.body ?? '';
  }
  return prompt.body ?? '';
}

export function setPromptBody(
  element: any,
  agentTaskType: string,
  body: string,
  services: ModdleServices,
): void {
  const { modeling, moddle } = services;
  const businessObject = getBusinessObject(element);

  let extensionElements = businessObject.extensionElements;
  if (!extensionElements) {
    extensionElements = moddle.create('bpmn:ExtensionElements', { values: [] });
    extensionElements.$parent = businessObject;
    modeling.updateModdleProperties(element, businessObject, { extensionElements });
  }

  let agentTask = (extensionElements.values || []).find((value: any) => value.$type === agentTaskType);
  if (!agentTask) {
    agentTask = moddle.create(agentTaskType, {});
    agentTask.$parent = extensionElements;
    modeling.updateModdleProperties(element, extensionElements, {
      values: [...(extensionElements.values || []), agentTask],
    });
  }

  if (!body.trim()) {
    modeling.updateModdleProperties(element, agentTask, { prompt: undefined });
    return;
  }

  const prompt = moddle.create(PROMPT_TYPE, { body });
  prompt.$parent = agentTask;
  modeling.updateModdleProperties(element, agentTask, { prompt });
}
