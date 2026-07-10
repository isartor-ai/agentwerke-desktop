import { describe, expect, it } from 'vitest';
import { createEmptyDiagram } from './constants';
import { inspectAgentwerkeXml } from './xmlMetadata';

describe('inspectAgentwerkeXml', () => {
  it('reports the Agentwerke namespace for new diagrams', () => {
    const result = inspectAgentwerkeXml(createEmptyDiagram('DemoProcess'));

    expect(result.processName).toBe('Untitled Agentwerke Workflow');
    expect(result.hasAgentwerkeNamespace).toBe(true);
    expect(result.agentTaskCount).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it('counts Agentwerke task metadata and prompts', () => {
    const result = inspectAgentwerkeXml(`<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:agentwerke="https://agentwerke.de/bpmn/extensions/v1">
  <bpmn:process id="IssueToPr" name="Issue to PR">
    <bpmn:serviceTask id="Analyze">
      <bpmn:extensionElements>
        <agentwerke:agentTask agent="analyst" action="analyze" purposeType="analysis" policyTag="standard">
          <agentwerke:prompt>Summarize the issue.</agentwerke:prompt>
        </agentwerke:agentTask>
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    <bpmn:userTask id="Review">
      <bpmn:extensionElements>
        <agentwerke:approvalTask purposeType="human-approval" policyTag="standard" />
      </bpmn:extensionElements>
    </bpmn:userTask>
    <bpmn:intermediateCatchEvent id="Wait">
      <bpmn:extensionElements>
        <agentwerke:externalEvent messageName="github.pull_request.merged" correlationKeyTemplate="{{input.branch}}" />
      </bpmn:extensionElements>
    </bpmn:intermediateCatchEvent>
  </bpmn:process>
</bpmn:definitions>`);

    expect(result).toMatchObject({
      processName: 'Issue to PR',
      hasAgentwerkeNamespace: true,
      agentTaskCount: 1,
      approvalTaskCount: 1,
      externalEventCount: 1,
      promptCount: 1,
      errors: [],
    });
  });

  it('surfaces parser errors', () => {
    const result = inspectAgentwerkeXml('<bpmn:definitions>');

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.processName).toBe('Invalid BPMN XML');
  });
});
