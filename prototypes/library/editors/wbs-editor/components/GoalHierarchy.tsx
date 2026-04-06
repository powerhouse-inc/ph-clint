import { GoalGrid } from "./GoalGrid.js";

interface GoalHierarchyProps {
  onGoalSelect?: (goalId: string) => void;
}

export function GoalHierarchy({ onGoalSelect }: GoalHierarchyProps) {
  return <GoalGrid onGoalSelect={onGoalSelect} />;
}
