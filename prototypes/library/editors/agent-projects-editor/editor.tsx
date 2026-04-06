import { generateId } from "document-model/core";
import { useSelectedAgentProjectsDocument } from "@powerhousedao/agent-manager/document-models/agent-projects";
import {
  createProject,
  runProject,
  stopProject,
  deleteProject,
} from "@powerhousedao/agent-manager/document-models/agent-projects";
import { ProjectList } from "./components/ProjectList.js";
import { CreateProjectForm } from "./components/CreateProjectForm.js";
import { ProjectStats } from "./components/ProjectStats.js";
import { DocumentToolbar } from "@powerhousedao/design-system/connect/index";

export default function Editor() {
  const [document, dispatch] = useSelectedAgentProjectsDocument();

  if (!document) return null;

  const state = document.state.global;
  const projects = state.projects || [];

  const handleCreateProject = (
    name: string,
    connectPort?: number,
    switchboardPort?: number,
  ) => {
    dispatch(
      createProject({
        id: generateId(),
        name,
        connectPort,
        switchboardPort,
      }),
    );
  };

  const handleRunProject = (projectId: string) => {
    dispatch(runProject({ projectId }));
  };

  const handleStopProject = (projectId: string) => {
    dispatch(stopProject({ projectId }));
  };

  const handleDeleteProject = (projectId: string) => {
    dispatch(deleteProject({ projectId }));
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <DocumentToolbar />
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Agent Projects Manager
          </h1>
          <p className="text-gray-600">
            Manage Powerhouse projects with targeted and current state tracking.
            Set the targeted state for projects and watch as the system
            reconciles them.
          </p>
        </div>

        {/* Stats */}
        <ProjectStats projects={projects} />

        {/* Create Project Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Project
          </h2>
          <CreateProjectForm onCreateProject={handleCreateProject} />
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Projects ({projects.length})
          </h2>
          {projects.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No projects yet. Create your first project above.
            </p>
          ) : (
            <ProjectList
              projects={projects}
              onRunProject={handleRunProject}
              onStopProject={handleStopProject}
              onDeleteProject={handleDeleteProject}
            />
          )}
        </div>
      </div>
    </div>
  );
}
