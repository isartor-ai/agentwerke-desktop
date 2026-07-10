export interface ValidationIssue {
  message: string;
  elementId?: string | null;
  elementName?: string | null;
  lineNumber?: number | null;
  linePosition?: number | null;
}

export interface ValidationWarning {
  message: string;
  elementId?: string | null;
  elementName?: string | null;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationWarning[];
}

export interface PublishWorkflowResponse {
  workflowId: string;
  status: string;
  publishedAt?: string;
  version?: number;
}

export interface ImportWorkflowResponse {
  workflowId: string;
  validation: WorkflowValidationResult;
}

export interface ServerSettings {
  baseUrl: string;
  token: string;
}

export interface SelectedElementMetadata {
  elementId: string;
  elementName: string;
  bpmnType: string;
  agentTask?: {
    agent?: string;
    action?: string;
    purposeType?: string;
    policyTag?: string;
    prompt?: string;
  };
  approvalTask?: {
    purposeType?: string;
    policyTag?: string;
  };
  externalEvent?: {
    messageName?: string;
    correlationKeyTemplate?: string;
  };
}
