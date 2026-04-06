import type { DocumentModelGlobalState } from "document-model";

export const documentModel: DocumentModelGlobalState = {
  author: {
    name: "Powerhouse",
    website: "https://www.powerhouse.inc/",
  },
  description:
    "Document model for managing Powerhouse projects with targeted vs current state pattern for declarative project lifecycle management",
  extension: ".aprj",
  id: "powerhouse/agent-projects",
  name: "AgentProjects",
  specifications: [
    {
      changeLog: [],
      modules: [
        {
          description: "Operations for setting targeted states for projects",
          id: "project-targeting",
          name: "project-targeting",
          operations: [
            {
              description: "Mark a new project for creation",
              errors: [],
              examples: [],
              id: "target-new-project",
              name: "CREATE_PROJECT",
              reducer:
                "const newProject = {\n  id: action.input.id,\n  name: action.input.name,\n  path: null,\n  currentStatus: 'MISSING',\n  targetedStatus: 'STOPPED',\n  configuration: {\n    connectPort: action.input.connectPort || 5000,\n    switchboardPort: action.input.switchboardPort || 6100,\n    startupTimeout: 30000,\n    autoStart: false\n  },\n  runtime: null,\n  logs: []\n};\nstate.projects.push(newProject);",
              schema:
                "input CreateProjectInput {\n  id: OID!\n  name: String!\n  connectPort: Int\n  switchboardPort: Int\n}",
              scope: "global",
              template: "Mark a new project for creation",
            },
            {
              description: "Mark project to be started/kept running",
              errors: [
                {
                  code: "PROJECT_NOT_FOUND",
                  description: "The specified project ID does not exist",
                  id: "project-not-found-1",
                  name: "ProjectNotFoundError",
                  template: "",
                },
              ],
              examples: [],
              id: "target-project-active",
              name: "RUN_PROJECT",
              reducer:
                "const project = state.projects.find(p => p.id === action.input.projectId);\nif (!project) {\n  throw new ProjectNotFoundError(`Project with ID ${action.input.projectId} not found`);\n}\n\n// Smart logic: Only one project can have RUNNING target\n// Stop all other projects that are targeted to run\nstate.projects.forEach(p => {\n  if (p.id !== action.input.projectId && p.targetedStatus === 'RUNNING') {\n    p.targetedStatus = 'STOPPED';\n  }\n});\n\nproject.targetedStatus = 'RUNNING';",
              schema: "input RunProjectInput {\n  projectId: OID!\n}",
              scope: "global",
              template: "Mark project to be started/kept running",
            },
            {
              description: "Mark project to be stopped",
              errors: [
                {
                  code: "PROJECT_NOT_FOUND",
                  description: "The specified project ID does not exist",
                  id: "project-not-found-2",
                  name: "ProjectNotFoundError",
                  template: "",
                },
              ],
              examples: [],
              id: "target-project-inactive",
              name: "STOP_PROJECT",
              reducer:
                "const project = state.projects.find(p => p.id === action.input.projectId);\nif (!project) {\n  throw new ProjectNotFoundError(`Project with ID ${action.input.projectId} not found`);\n}\nproject.targetedStatus = 'STOPPED';",
              schema: "input StopProjectInput {\n  projectId: OID!\n}",
              scope: "global",
              template: "Mark project to be stopped",
            },
            {
              description: "Mark project for removal",
              errors: [
                {
                  code: "PROJECT_NOT_FOUND",
                  description: "The specified project ID does not exist",
                  id: "project-not-found-3",
                  name: "ProjectNotFoundError",
                  template: "",
                },
              ],
              examples: [],
              id: "target-project-deletion",
              name: "DELETE_PROJECT",
              reducer:
                "const project = state.projects.find(p => p.id === action.input.projectId);\nif (!project) {\n  throw new ProjectNotFoundError(`Project with ID ${action.input.projectId} not found`);\n}\n\nproject.targetedStatus = 'DELETED';\n\n// Smart logic: Auto-reconcile DELETED status\n// If current status is MISSING and we target DELETED, it's effectively deleted\nif (project.currentStatus === 'MISSING') {\n  project.currentStatus = 'DELETED';\n}",
              schema: "input DeleteProjectInput {\n  projectId: OID!\n}",
              scope: "global",
              template: "Mark project for removal",
            },
          ],
        },
        {
          description:
            "Operations for managing project records and configuration",
          id: "project-management",
          name: "project-management",
          operations: [
            {
              description: "Add already-existing project to tracking",
              errors: [
                {
                  code: "DUPLICATE_PROJECT",
                  description:
                    "A project with the same name or path already exists",
                  id: "duplicate-project-1",
                  name: "DuplicateProjectError",
                  template: "",
                },
              ],
              examples: [],
              id: "register-existing-project",
              name: "REGISTER_PROJECT",
              reducer:
                "const existingProject = state.projects.find(p => p.name === action.input.name || p.path === action.input.path);\nif (existingProject) {\n  throw new DuplicateProjectError(`Project with name '${action.input.name}' or path '${action.input.path}' already exists`);\n}\n\nconst newProject = {\n  id: action.input.id,\n  name: action.input.name,\n  path: action.input.path,\n  currentStatus: action.input.currentStatus,\n  targetedStatus: 'STOPPED',\n  configuration: {\n    connectPort: action.input.connectPort,\n    switchboardPort: action.input.switchboardPort,\n    startupTimeout: action.input.startupTimeout,\n    autoStart: action.input.autoStart\n  },\n  runtime: null,\n  logs: []\n};\nstate.projects.push(newProject);",
              schema:
                "input RegisterProjectInput {\n  id: OID!\n  name: String!\n  path: String!\n  connectPort: Int!\n  switchboardPort: Int!\n  startupTimeout: Int!\n  autoStart: Boolean!\n  currentStatus: CurrentStatus!\n}",
              scope: "global",
              template: "Add already-existing project to tracking",
            },
            {
              description: "Update project configuration",
              errors: [
                {
                  code: "PROJECT_NOT_FOUND",
                  description: "The specified project ID does not exist",
                  id: "project-not-found-11",
                  name: "ProjectNotFoundError",
                  template: "",
                },
              ],
              examples: [],
              id: "update-project-config",
              name: "UPDATE_PROJECT_CONFIG",
              reducer:
                "const project = state.projects.find(p => p.id === action.input.projectId);\nif (!project) {\n  throw new ProjectNotFoundError(`Project with ID ${action.input.projectId} not found`);\n}\nif (action.input.connectPort !== undefined && action.input.connectPort !== null) {\n  project.configuration.connectPort = action.input.connectPort;\n}\nif (action.input.switchboardPort !== undefined && action.input.switchboardPort !== null) {\n  project.configuration.switchboardPort = action.input.switchboardPort;\n}\nif (action.input.startupTimeout !== undefined && action.input.startupTimeout !== null) {\n  project.configuration.startupTimeout = action.input.startupTimeout;\n}\nif (action.input.autoStart !== undefined && action.input.autoStart !== null) {\n  project.configuration.autoStart = action.input.autoStart;\n}",
              schema:
                "input UpdateProjectConfigInput {\n  projectId: OID!\n  connectPort: Int\n  switchboardPort: Int\n  startupTimeout: Int\n  autoStart: Boolean\n}",
              scope: "global",
              template: "Update project configuration",
            },
            {
              description: "Update project filesystem location",
              errors: [
                {
                  code: "PROJECT_NOT_FOUND",
                  description: "The specified project ID does not exist",
                  id: "project-not-found-12",
                  name: "ProjectNotFoundError",
                  template: "",
                },
                {
                  code: "DUPLICATE_PROJECT",
                  description:
                    "Another project already exists at the specified path",
                  id: "duplicate-project-2",
                  name: "DuplicateProjectError",
                  template: "",
                },
              ],
              examples: [],
              id: "update-project-path",
              name: "UPDATE_PROJECT_STATUS",
              reducer:
                "const project = state.projects.find(p => p.id === action.input.projectId);\nif (!project) {\n  throw new ProjectNotFoundError(`Project with ID ${action.input.projectId} not found`);\n}\n\nconst previousStatus = project.currentStatus;\nproject.currentStatus = action.input.currentStatus;\n\n// Update path if provided\nif (action.input.path !== undefined && action.input.path !== null) {\n  project.path = action.input.path;\n}\n\n// Smart logic: Clear runtime info when stopping\n// If transitioning to STOPPED, clear the runtime info\nif (action.input.currentStatus === 'STOPPED' && previousStatus === 'RUNNING') {\n  project.runtime = null;\n}",
              schema:
                "input UpdateProjectStatusInput {\n  projectId: OID!\n  currentStatus: CurrentStatus!\n  path: String\n}",
              scope: "global",
              template: "Update project filesystem location",
            },
          ],
        },
        {
          description: "Operations for managing project runtime information",
          id: "runtime-info",
          name: "runtime-info",
          operations: [
            {
              description: "Update runtime details (PID, ports, drive URL)",
              errors: [
                {
                  code: "PROJECT_NOT_FOUND",
                  description: "The specified project ID does not exist",
                  id: "project-not-found-13",
                  name: "ProjectNotFoundError",
                  template: "",
                },
              ],
              examples: [],
              id: "update-runtime-info",
              name: "UPDATE_RUNTIME_INFO",
              reducer:
                "const project = state.projects.find(p => p.id === action.input.projectId);\nif (!project) {\n  throw new ProjectNotFoundError(`Project with ID ${action.input.projectId} not found`);\n}\n\nproject.runtime = {\n  pid: action.input.pid,\n  startedAt: action.input.startedAt,\n  driveUrl: action.input.driveUrl || null,\n  connectPort: action.input.connectPort,\n  switchboardPort: action.input.switchboardPort\n};",
              schema:
                "input UpdateRuntimeInfoInput {\n  projectId: OID!\n  pid: Int!\n  startedAt: DateTime!\n  driveUrl: String\n  connectPort: Int!\n  switchboardPort: Int!\n}",
              scope: "global",
              template: "Update runtime details (PID, ports, drive URL)",
            },
          ],
        },
        {
          description: "Operations for managing project logs",
          id: "logs",
          name: "logs",
          operations: [
            {
              description: "Append a log entry",
              errors: [
                {
                  code: "PROJECT_NOT_FOUND",
                  description: "The specified project ID does not exist",
                  id: "project-not-found-16",
                  name: "ProjectNotFoundError",
                  template: "",
                },
              ],
              examples: [],
              id: "add-log-entry",
              name: "ADD_LOG_ENTRY",
              reducer:
                "const project = state.projects.find(p => p.id === action.input.projectId);\nif (!project) {\n  throw new ProjectNotFoundError(`Project with ID ${action.input.projectId} not found`);\n}\nconst logEntry = {\n  id: action.input.id,\n  timestamp: action.input.timestamp,\n  message: action.input.message\n};\nproject.logs.push(logEntry);",
              schema:
                "input AddLogEntryInput {\n  projectId: OID!\n  timestamp: DateTime!\n  message: String!\n}",
              scope: "global",
              template: "Append a log entry",
            },
            {
              description: "Clear logs for a project",
              errors: [
                {
                  code: "PROJECT_NOT_FOUND",
                  description: "The specified project ID does not exist",
                  id: "project-not-found-17",
                  name: "ProjectNotFoundError",
                  template: "",
                },
              ],
              examples: [],
              id: "clear-project-logs",
              name: "CLEAR_PROJECT_LOGS",
              reducer:
                "const project = state.projects.find(p => p.id === action.input.projectId);\nif (!project) {\n  throw new ProjectNotFoundError(`Project with ID ${action.input.projectId} not found`);\n}\nproject.logs = [];",
              schema: "input ClearProjectLogsInput {\n  projectId: OID!\n}",
              scope: "global",
              template: "Clear logs for a project",
            },
          ],
        },
      ],
      state: {
        global: {
          examples: [],
          initialValue: '{\n  "projects": []\n}',
          schema:
            "type AgentProjectsState {\n  projects: [Project!]!\n}\n\ntype Project {\n  id: OID!\n  name: String!\n  currentStatus: CurrentStatus!\n  targetedStatus: TargetedStatus!\n  configuration: ProjectConfig!\n  path: String\n  runtime: RuntimeInfo\n  logs: [LogEntry!]!\n}\n\nenum TargetedStatus {\n  STOPPED\n  RUNNING\n  DELETED\n}\n\nenum CurrentStatus {\n  MISSING\n  INITIALIZING\n  STOPPED\n  RUNNING\n  DELETED\n}\n\ntype ProjectConfig {\n  connectPort: Int!\n  switchboardPort: Int!\n  startupTimeout: Int!\n  autoStart: Boolean!\n}\n\ntype RuntimeInfo {\n  pid: Int!\n  startedAt: DateTime!\n  driveUrl: String\n  connectPort: Int!\n  switchboardPort: Int!\n}\n\ntype LogEntry {\n  timestamp: DateTime!\n  message: String!\n}",
        },
        local: {
          examples: [],
          initialValue: "",
          schema: "",
        },
      },
      version: 1,
    },
  ],
};
