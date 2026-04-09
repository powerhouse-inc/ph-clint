---
name: reactor-package-project-management
description: "Initialize and run Reactor Package projects with Vetra services"
metadata:
  author: Powerhouse
  version: "1.0.0"
---

# RPPM.00 Initialize a new Reactor Package Project

## RPPM.00.1 Inspect existing projects

- Use the `reactor-packages-list` tool to get all existing projects
- Note how many projects already exist in the system and what the project paths are
- Verify that NO project is currently in "running" state
- If a project is running, use `vetra-stop` to stop it first

## RPPM.00.2 Generate unique project name

- Create a suitable, descriptive project name in kebab case that reflects the package name, for example `acme-invoicing`
- If the name alreay exists, use the current date and time as suffix, e.g. `acme-invoicing-20260120-1635`
- The name must match pattern: `/^[a-zA-Z0-9-_]+$/`

## RPPM.00.3 Initialize the project

- Use `reactor-package-init` with the generated project name
- Wait for the initialization to complete
- Capture the project path returned by the tool
- Use `reactor-packages-list` to confirm the new project appears in the list and see its status

# RPPM.01 Run the Reactor Package project and capture Vetra MCP endpoint

## RPPM.01.1 Start the Reactor Package project and wait until it's ready

- Use `vetra-start` with the project name from step 01
- The project will start running `ph vetra --watch` in the background
- Wait for the command to be accepted
- Use `vetra-ps` repeatedly to check if the project is ready
- Poll every 2-3 seconds for up to 90 seconds
- The project is ready when Vetra Connect and Switchboard are both running. Use `vetra-ps` to get the current status.
- Use `vetra-logs` to capture the startup logs

## RPPM.01.2 Parse and verify the Vetra endpoints

From the logs, identify:
 - Vetra Studio port / URL
 - Vetra Switchboard port / URL
 - MCP endpoint URL

Once project is running, a new suite of MCP tools, `vetra-mcp__*`, will automatically become
available to you. Remember to use it later to create specification documents for document models, document 
editors, drive apps, and GraphQL subgraphs.

Test the `vetra-mcp__*` MCP tools now by getting the available drives in the new Vetra instance.
Notice there is a vetra drive` for the specification documents and a preview drive for testing out the document
models you will yourself create.

# RPPM.02 Stop the project

## RPPM.02.1 Verify project is running

- Use `vetra-ps` with the project name
- Confirm the project is currently in "running" state
- If not running, skip to the final status step

## RPPM.02.2 Shutdown the project

- Use `vetra-stop` with the project name
- This will stop both Vetra Connect and Switchboard services
- Wait for the shutdown command to complete
- Use `vetra-ps` to confirm the project is now "stopped"
- Optionally get final logs with `vetra-logs`
