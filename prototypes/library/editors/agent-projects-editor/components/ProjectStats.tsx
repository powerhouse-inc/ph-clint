import type { Project } from "@powerhousedao/agent-manager/document-models/agent-projects";

interface ProjectStatsProps {
  projects: Project[];
}

export function ProjectStats({ projects }: ProjectStatsProps) {
  const stats = {
    total: projects.length,
    stopped: projects.filter((p) => p.currentStatus === "STOPPED").length,
    missing: projects.filter((p) => p.currentStatus === "MISSING").length,
    deleted: projects.filter((p) => p.currentStatus === "DELETED").length,
    targetedRunning: projects.filter((p) => p.targetedStatus === "RUNNING")
      .length,
    needsReconciliation: projects.filter((p) => {
      const current = p.currentStatus;
      const targeted = p.targetedStatus;

      // Check if reconciliation is needed
      if (targeted === "RUNNING" && current !== "RUNNING") return true;
      if (targeted === "STOPPED" && current === "RUNNING") return true;
      if (
        targeted === "DELETED" &&
        current !== "MISSING" &&
        current !== "DELETED"
      )
        return true;

      return false;
    }).length,
  };

  if (stats.total === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <StatCard
        title="Total"
        value={stats.total}
        color="bg-gray-100 text-gray-800"
      />
      <StatCard
        title="Stopped"
        value={stats.stopped}
        color="bg-gray-100 text-gray-800"
      />
      <StatCard
        title="Missing"
        value={stats.missing}
        color="bg-yellow-100 text-yellow-800"
      />
      <StatCard
        title="Target Running"
        value={stats.targetedRunning}
        color="bg-blue-100 text-blue-800"
      />
      <StatCard
        title="Needs Sync"
        value={stats.needsReconciliation}
        color="bg-amber-100 text-amber-800"
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: string;
}

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wider opacity-80">{title}</div>
    </div>
  );
}
