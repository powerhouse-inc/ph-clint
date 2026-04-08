---
name: project-management
description: "Skill for project management. Provides step-by-step guidance for completing project management tasks."
metadata:
  author: Powerhouse
  version: "1.0.0"
---

# Project Management Skill

This skill covers the lifecycle of a Powerhouse Reactor Package project: initialization, running the development server, and checking status.

## Prerequisites

- A workspace directory where projects are created
- The `ph` CLI tool installed globally
- Service manager configured with a Vetra service definition

## Guidelines

- Always check for existing projects before creating new ones
- Use the service manager (`/svc`) for starting and stopping Vetra
- Project names must match the pattern `/^[a-zA-Z0-9-_]+$/`

## Scenario: Initialize a New Reactor Project

### Steps

1. **Check existing projects** — Use `/svc` to see if a project is already running.
2. **Generate project name** — Create a unique project name in kebab-case matching `/^[a-zA-Z0-9-_]+$/`.
3. **Run initialization** — Use the `init` command: `/init --name <project-name>`.
4. **Verify** — Confirm the project directory contains `package.json` and `powerhouse.config.json`.

## Scenario: Run the Development Server

### Steps

1. **Start the Vetra service** — Use `/svc --action up` to start the Vetra dev server.
2. **Wait for readiness** — The service manager detects three readiness patterns:
   - Connect Studio port
   - Drive URL
   - MCP server URL
3. **Capture endpoints** — Once ready, the service endpoints are available via `/svc`.
4. **Verify** — Check that all three endpoints are captured and accessible.

## Scenario: Check Project Status

### Steps

1. **Query service status** — Use `/svc` to view all service statuses.
2. **Review endpoints** — Check captured endpoints (connect-studio, drive-url, mcp-server).
3. **Check logs** — Use `/svc --action logs --id vetra` to review recent output.
4. **Report** — Summarize the current state: running/stopped, ports, URLs.

## Expected Skill Outcome

A Reactor Package project is initialized, the Vetra development server is running, and all endpoints (Connect Studio, Drive URL, MCP server) are captured and verified.
