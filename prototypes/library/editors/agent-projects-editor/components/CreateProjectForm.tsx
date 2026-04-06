import { useState, type FormEventHandler } from "react";

interface CreateProjectFormProps {
  onCreateProject: (
    name: string,
    connectPort?: number,
    switchboardPort?: number,
  ) => void;
}

export function CreateProjectForm({ onCreateProject }: CreateProjectFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const connectPort = formData.get("connectPort") as string;
    const switchboardPort = formData.get("switchboardPort") as string;

    if (!name.trim()) return;

    onCreateProject(
      name.trim(),
      connectPort ? parseInt(connectPort, 10) : undefined,
      switchboardPort ? parseInt(switchboardPort, 10) : undefined,
    );

    form.reset();
    setShowAdvanced(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Project Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="my-project"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showAdvanced ? "Hide" : "Show"} Advanced
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Project
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="border-t pt-4 grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="connectPort"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Connect Port (default: 5000)
            </label>
            <input
              type="number"
              id="connectPort"
              name="connectPort"
              placeholder="5000"
              min="1024"
              max="65535"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="switchboardPort"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Switchboard Port (default: 6100)
            </label>
            <input
              type="number"
              id="switchboardPort"
              name="switchboardPort"
              placeholder="6100"
              min="1024"
              max="65535"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </form>
  );
}
