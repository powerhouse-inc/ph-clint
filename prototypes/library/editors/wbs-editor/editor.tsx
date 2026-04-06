import { useState } from "react";
import { DocumentToolbar } from "@powerhousedao/design-system/connect/index";
import { EditWorkBreakdownStructureName } from "./components/EditName.js";
import { WBSSidebar } from "./components/Sidebar.js";
import { GoalHierarchy } from "./components/GoalHierarchy.js";
import { GoalEditSidebar } from "./components/GoalEditSidebar.js";

/** WBS Editor with sidebar for metadata and main area for goal hierarchy */
export default function Editor() {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoalId(goalId);
  };

  const handleGoalDeselect = () => {
    setSelectedGoalId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto 1.5rem auto",
          width: "100%",
        }}
      >
        <DocumentToolbar />
      </div>

      {/* Main container with maximum height and separate scroll areas */}
      <div
        className="flex overflow-hidden border border-gray-200 shadow-md"
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          width: "100%",
          maxHeight: "calc(100vh - 120px)", // Leave room for toolbar and margins
          height: "calc(100vh - 120px)",
        }}
      >
        {/* Main content area with its own scrollbar */}
        <div className="flex-1 p-8 overflow-y-auto overflow-x-hidden bg-white">
          <GoalHierarchy onGoalSelect={handleGoalSelect} />
        </div>

        {/* Sidebar with its own scrollbar */}
        <div
          className="border-l border-gray-200 bg-gray-50 overflow-y-auto overflow-x-hidden"
          style={{
            flexShrink: 0,
            width: "400px",
            minWidth: "400px",
          }}
        >
          {selectedGoalId ? (
            <GoalEditSidebar
              goalId={selectedGoalId}
              onClose={handleGoalDeselect}
            />
          ) : (
            <WBSSidebar />
          )}
        </div>
      </div>
    </div>
  );
}
