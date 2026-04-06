import type { Project } from "@powerhousedao/agent-manager/document-models/agent-projects";
import { ProjectCard } from "./ProjectCard.js";

interface ProjectListProps {
  projects: Project[];
  onRunProject: (projectId: string) => void;
  onStopProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectList({
  projects,
  onRunProject,
  onStopProject,
  onDeleteProject,
}: ProjectListProps) {
  // Sort projects: running first, targeted to run second, deleted last, then rest
  const sortedProjects = [...projects].sort((a, b) => {
    // Deleted projects go to the bottom
    const aDeleted =
      a.currentStatus === "DELETED" ||
      (a.currentStatus === "MISSING" && a.targetedStatus === "DELETED");
    const bDeleted =
      b.currentStatus === "DELETED" ||
      (b.currentStatus === "MISSING" && b.targetedStatus === "DELETED");

    if (aDeleted && !bDeleted) return 1;
    if (!aDeleted && bDeleted) return -1;

    // Running project comes first (unless deleted)
    if (!aDeleted && a.currentStatus === "RUNNING") return -1;
    if (!bDeleted && b.currentStatus === "RUNNING") return 1;

    // Project targeted to run comes second (unless deleted)
    if (
      !aDeleted &&
      a.targetedStatus === "RUNNING" &&
      (a.currentStatus as string) !== "RUNNING"
    )
      return -1;
    if (
      !bDeleted &&
      b.targetedStatus === "RUNNING" &&
      (b.currentStatus as string) !== "RUNNING"
    )
      return 1;

    // Keep original order for the rest
    return 0;
  });

  return (
    <div className="space-y-4">
      {sortedProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onRunProject={onRunProject}
          onStopProject={onStopProject}
          onDeleteProject={onDeleteProject}
        />
      ))}
    </div>
  );
}
