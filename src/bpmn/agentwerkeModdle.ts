import { AGENTWERKE_NS_PREFIX, AGENTWERKE_NS_URI } from './constants';

export const agentwerkeModdleDescriptor = {
  name: 'Agentwerke',
  uri: AGENTWERKE_NS_URI,
  prefix: AGENTWERKE_NS_PREFIX,
  xml: {
    tagAlias: 'lowerCase',
  },
  associations: [],
  types: [
    {
      name: 'AgentTask',
      superClass: ['Element'],
      properties: [
        { name: 'agent', isAttr: true, type: 'String' },
        { name: 'action', isAttr: true, type: 'String' },
        { name: 'environment', isAttr: true, type: 'String' },
        { name: 'purposeType', isAttr: true, type: 'String' },
        { name: 'policyTag', isAttr: true, type: 'String' },
        { name: 'executionMode', isAttr: true, type: 'String' },
        { name: 'sandboxProfile', isAttr: true, type: 'String' },
        { name: 'permissionLevel', isAttr: true, type: 'String' },
        { name: 'allowedTools', isAttr: true, type: 'String' },
        { name: 'deniedTools', isAttr: true, type: 'String' },
        { name: 'requiresEvidence', isAttr: true, type: 'String' },
        { name: 'maxRetries', isAttr: true, type: 'Integer' },
        { name: 'retryBackoffSeconds', isAttr: true, type: 'Integer' },
        { name: 'timeoutSeconds', isAttr: true, type: 'Integer' },
        { name: 'prompt', type: 'Prompt' },
      ],
    },
    {
      name: 'Prompt',
      superClass: ['Element'],
      properties: [{ name: 'body', isBody: true, type: 'String' }],
    },
    {
      name: 'ApprovalTask',
      superClass: ['Element'],
      properties: [
        { name: 'purposeType', isAttr: true, type: 'String' },
        { name: 'policyTag', isAttr: true, type: 'String' },
        { name: 'approvalRole', isAttr: true, type: 'String' },
      ],
    },
    {
      name: 'ExternalEvent',
      superClass: ['Element'],
      properties: [
        { name: 'messageName', isAttr: true, type: 'String' },
        { name: 'correlationKeyTemplate', isAttr: true, type: 'String' },
      ],
    },
  ],
};
