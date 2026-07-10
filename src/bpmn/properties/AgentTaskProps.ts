import { html } from 'htm/preact';
import {
  isNumberFieldEntryEdited,
  isSelectEntryEdited,
  isTextFieldEntryEdited,
  NumberFieldEntry,
  SelectEntry,
  TextFieldEntry,
} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { AGENT_TASK_TYPE } from '../constants';
import { getExtension, getExtensionProperty, getPromptBody, setExtensionProperty, setPromptBody } from './extensionUtil';

/* eslint-disable @typescript-eslint/no-explicit-any */

function textField(attribute: string, label: string, placeholder?: string) {
  return function AgentTaskTextField(props: any) {
    const { element, id } = props;
    const modeling = useService('modeling');
    const moddle = useService('moddle');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => getExtensionProperty(element, AGENT_TASK_TYPE, attribute);
    const setValue = (value: string) =>
      setExtensionProperty(element, AGENT_TASK_TYPE, { [attribute]: value }, { modeling, moddle });

    return html`<${TextFieldEntry}
      id=${id}
      element=${element}
      label=${translate(label)}
      getValue=${getValue}
      setValue=${setValue}
      debounce=${debounce}
      ...${placeholder ? { placeholder } : {}}
    />`;
  };
}

function promptField() {
  return function AgentTaskPromptField(props: any) {
    const { element, id } = props;
    const modeling = useService('modeling');
    const moddle = useService('moddle');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => getPromptBody(getExtension(element, AGENT_TASK_TYPE));
    const setValue = (value: string) => setPromptBody(element, AGENT_TASK_TYPE, value, { modeling, moddle });

    return html`<${TextFieldEntry}
      id=${id}
      element=${element}
      label=${translate('Prompt')}
      getValue=${getValue}
      setValue=${setValue}
      debounce=${debounce}
      placeholder=${'Instructions for this agent step'}
    />`;
  };
}

function selectField(
  attribute: string,
  label: string,
  options: ReadonlyArray<{ value: string; label: string }>,
) {
  return function AgentTaskSelectField(props: any) {
    const { element, id } = props;
    const modeling = useService('modeling');
    const moddle = useService('moddle');
    const translate = useService('translate');

    const getValue = () => getExtensionProperty(element, AGENT_TASK_TYPE, attribute) ?? '';
    const setValue = (value: string) =>
      setExtensionProperty(element, AGENT_TASK_TYPE, { [attribute]: value || undefined }, { modeling, moddle });
    const getOptions = () => options.map((option) => ({
      value: option.value,
      label: translate(option.label),
    }));

    return html`<${SelectEntry}
      id=${id}
      element=${element}
      label=${translate(label)}
      getValue=${getValue}
      setValue=${setValue}
      getOptions=${getOptions}
    />`;
  };
}

function numberField(attribute: string, label: string) {
  return function AgentTaskNumberField(props: any) {
    const { element, id } = props;
    const modeling = useService('modeling');
    const moddle = useService('moddle');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => getExtensionProperty(element, AGENT_TASK_TYPE, attribute);
    const setValue = (value: string) =>
      setExtensionProperty(
        element,
        AGENT_TASK_TYPE,
        { [attribute]: value === '' || value === undefined ? undefined : Number(value) },
        { modeling, moddle },
      );

    return html`<${NumberFieldEntry}
      id=${id}
      element=${element}
      label=${translate(label)}
      getValue=${getValue}
      setValue=${setValue}
      debounce=${debounce}
      min=${0}
    />`;
  };
}

const EXECUTION_MODE_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'local', label: 'local' },
  { value: 'tool_sandboxed', label: 'tool_sandboxed' },
  { value: 'agent_sandboxed', label: 'agent_sandboxed' },
] as const;

const SANDBOX_PROFILE_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'offline', label: 'offline' },
  { value: 'repo-read', label: 'repo-read' },
  { value: 'repo-write', label: 'repo-write' },
  { value: 'deployment', label: 'deployment' },
] as const;

const PERMISSION_LEVEL_OPTIONS = [
  { value: '', label: 'Default (read-only)' },
  { value: 'read-only', label: 'read-only' },
  { value: 'read-write', label: 'read-write' },
  { value: 'full', label: 'full' },
] as const;

export function agentTaskEntries(element: any) {
  return [
    { id: 'agentwerke-agent', component: textField('agent', 'Agent', 'e.g. analyst'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-action', component: textField('action', 'Action', 'e.g. analyze'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-purposeType', component: textField('purposeType', 'Purpose type', 'e.g. analysis'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-policyTag', component: textField('policyTag', 'Policy tag', 'e.g. standard'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-prompt', component: promptField(), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-environment', component: textField('environment', 'Environment', 'e.g. production'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-executionMode', component: selectField('executionMode', 'Execution mode', EXECUTION_MODE_OPTIONS), isEdited: isSelectEntryEdited, element },
    { id: 'agentwerke-sandboxProfile', component: selectField('sandboxProfile', 'Sandbox profile', SANDBOX_PROFILE_OPTIONS), isEdited: isSelectEntryEdited, element },
    { id: 'agentwerke-permissionLevel', component: selectField('permissionLevel', 'Permission level', PERMISSION_LEVEL_OPTIONS), isEdited: isSelectEntryEdited, element },
    { id: 'agentwerke-allowedTools', component: textField('allowedTools', 'Allowed tools', 'comma-separated'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-deniedTools', component: textField('deniedTools', 'Denied tools', 'comma-separated'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-requiresEvidence', component: textField('requiresEvidence', 'Required evidence', 'comma-separated'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-maxRetries', component: numberField('maxRetries', 'Max retries'), isEdited: isNumberFieldEntryEdited, element },
    { id: 'agentwerke-retryBackoffSeconds', component: numberField('retryBackoffSeconds', 'Retry backoff (s)'), isEdited: isNumberFieldEntryEdited, element },
    { id: 'agentwerke-timeoutSeconds', component: numberField('timeoutSeconds', 'Timeout (s)'), isEdited: isNumberFieldEntryEdited, element },
  ];
}
