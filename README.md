# Agentwerke Desktop

Agentwerke Desktop is a local BPMN authoring client for Agentwerke workflows. It
lets users create, open, edit, save, validate, and publish `.bpmn` files while
preserving the `agentwerke:*` BPMN extension metadata used by Agentwerke.

## Development

```bash
npm install
npm run dev
```

Run checks:

```bash
npm test
npm run typecheck
npm run build
```

## Desktop Workflow

1. Create or open a BPMN file.
2. Use the Agentwerke palette entries for agent tasks, approval gates, and
   external waits.
3. Edit Agentwerke metadata in the properties panel.
4. Save the file locally.
5. Configure the Agentwerke API URL and token.
6. Validate and publish through Agentwerke.

The app publishes through Agentwerke APIs. It does not deploy directly to
Camunda or any other BPMN runtime.
