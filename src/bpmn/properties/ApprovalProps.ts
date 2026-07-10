import { html } from 'htm/preact';
import { isTextFieldEntryEdited, TextFieldEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { APPROVAL_TASK_TYPE } from '../constants';
import { getExtensionProperty, setExtensionProperty } from './extensionUtil';

/* eslint-disable @typescript-eslint/no-explicit-any */

function textField(attribute: string, label: string, placeholder?: string) {
  return function ApprovalTextField(props: any) {
    const { element, id } = props;
    const modeling = useService('modeling');
    const moddle = useService('moddle');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = () => getExtensionProperty(element, APPROVAL_TASK_TYPE, attribute);
    const setValue = (value: string) =>
      setExtensionProperty(element, APPROVAL_TASK_TYPE, { [attribute]: value }, { modeling, moddle });

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

export function approvalEntries(element: any) {
  return [
    { id: 'agentwerke-approval-purposeType', component: textField('purposeType', 'Purpose type', 'e.g. human-approval'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-approval-policyTag', component: textField('policyTag', 'Policy tag', 'e.g. standard'), isEdited: isTextFieldEntryEdited, element },
    { id: 'agentwerke-approval-role', component: textField('approvalRole', 'Approval role', 'e.g. engineering-manager'), isEdited: isTextFieldEntryEdited, element },
  ];
}
