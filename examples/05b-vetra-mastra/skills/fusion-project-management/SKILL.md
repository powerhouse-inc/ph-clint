---
name: fusion-project-management
description: "Initialize, configure, and run Fusion project instances"
metadata:
  author: Powerhouse
  version: "1.0.0"
---

# FPM.00 Initialize a new Fusion Project

## FPM.00.1 Inspect existing projects

- Use the `fusion-projects-list` tool to get all existing Fusion projects
- Note how many projects already exist in the system and what the project paths are
- Verify that NO project is currently in "running" state
- If a project is running, use `fusion-project-stop` to stop it first

## FPM.00.2 Generate unique project name

- Create a suitable, descriptive project name in kebab case that reflects the package name, for example `acme-invoicing`
- If the name alreay exists, use the current date and time as suffix, e.g. `acme-invoicing-20260120-1635`
- The name must match pattern: `/^[a-zA-Z0-9-_]+$/`

## FPM.00.3 Initialize the project

- Use `fusion-project-init` with the generated project name
- Wait for the initialization to complete
- Capture the project path returned by the tool
- Use `fusion-projects-list` to confirm the new project appears in the list and see its status

# FPM.01 Obtain a Switchboard URL for Fusion

Every Fusion project uses a Switchboard instance as its backend. You will therefore have to identify
the Switchboard URL _before_ running the Fusion project through the Fusion project management tools. If you fail to provide a 
Switchboard URL, or you provide the wrong one, the Fusion project will fetch the wrong data or fail to 
fetch any data at all.

## FPM.01.1 Consider which backend should be used

Review the context that is available to you to decide which backend should be used: 
- Did the stakeholder explicitly provide a Switchboard URL? 
- Did the stakeholder indicate which Switchboard instance should be used as back-end?
- If the stakholder didn't mention anything, are they indirectly expecting the Fusion 
  platform to display any data that is known to be in a particular Switchboard instance?

In terms of data, consider: 
- Which document models and documents will be needed
- If there are different environments available between which you need to choose: 
  development, staging, or production.

Based on these considerations, decide to use: 
- An existing Switchboard instance, potentially running in the cloud, with a public URL
- A local Reactor Package project's Switchboard instance that you may need to start yourself

## FPM.01.2 Start a Reactor Package project if needed

If the Switchboard instance will be an existing instance running in the cloud, this step can be skipped.

However, if a local Reactor Package should function as backend, you need to start the Reactor Package 
first, before starting the depending Fusion project.

Use the the project management tools MCP tool to ensure that the correct Reactor Package project is running and capture its endpoint.

Consult your capability scenario CRP.01 with the `self_reflection` MCP if needed for the details.

## FPM.01.3 Identify and verify the Switchboard URL

Ensure that you extracted the Switchboard URL in the required format: `http(s)://domainname[:port]/graphql`, 
for example `http://localhost:4001/graphql` or `https://switchboard.cloudhosting.tld/graphql`

Make sure to add the `/graphql` path if needed.

Attach the Switchboard URL to the task outcome and/or instructions to the relevant goals in your WBS.

# FPM.02 Run the project and capture Vetra MCP endpoint

## FPM.02.1 Start the project and wait until it's ready

- Use `fusion-project-start --workdir <name> --switchboardUrl <url>` with the project name and switchboard URL from steps FPM.01 and FPM.02
- The project will start running `pnpm dev` in the background
- Wait for the command to be accepted
- Use `fusion-project-ps` repeatedly to check if the project is ready
- Poll every 2-3 seconds for up to 90 seconds
- The project is ready when the Next.js dev server is running. Use `fusion-project-ps` to get the current status.
- Use `fusion-project-logs` to capture the startup logs

## FPM.02.2 Parse and verify the Fusion endpoint

From the logs, identify the Fusion URL, including its port.

Attach the fusion URL to the relevant task instructions or comments in your WBS.

# FPM.03 Stop the project

## FPM.03.1 Verify project is running

- Use `fusion-project-ps` with the project name
- Confirm the project is currently in "running" state
- If not running, skip to the final status step

## FPM.03.2 Shutdown the project

- Use `fusion-project-stop` with the project name
- This will stop the Next.js service
- Wait for the shutdown command to complete
- Use `fusion-project-ps` to confirm the project is now "stopped"
- Optionally get final logs with `fusion-project-logs`
