import { setName } from "document-model";
import type { FormEventHandler, MouseEventHandler } from "react";
import { useState } from "react";
import { useSelectedAgentInboxDocument } from "@powerhousedao/agent-manager/document-models/agent-inbox";

/** Displays the name of the selected AgentInbox document and allows editing it */
export function EditAgentInboxName() {
  const [agentInboxDocument, dispatch] = useSelectedAgentInboxDocument();
  const [isEditing, setIsEditing] = useState(false);

  if (!agentInboxDocument) return null;

  const agentInboxDocumentName = agentInboxDocument.header.name;

  const onClickEditAgentInboxName: MouseEventHandler<
    HTMLButtonElement
  > = () => {
    setIsEditing(true);
  };

  const onClickCancelEditAgentInboxName: MouseEventHandler<
    HTMLButtonElement
  > = () => {
    setIsEditing(false);
  };

  const onSubmitSetName: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const name = nameInput.value;
    if (!name) return;

    dispatch(setName(name));
    setIsEditing(false);
  };

  if (isEditing)
    return (
      <form
        className="flex gap-2 items-center justify-between"
        onSubmit={onSubmitSetName}
      >
        <input
          className="text-lg font-semibold text-gray-900 p-1"
          type="text"
          name="name"
          defaultValue={agentInboxDocumentName}
          autoFocus
        />
        <div className="flex gap-2">
          <button type="submit" className="text-sm text-gray-600">
            Save
          </button>
          <button
            className="text-sm text-red-800"
            onClick={onClickCancelEditAgentInboxName}
          >
            Cancel
          </button>
        </div>
      </form>
    );

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-900">
        {agentInboxDocumentName}
      </h2>
      <button
        className="text-sm text-gray-600"
        onClick={onClickEditAgentInboxName}
      >
        Edit Name
      </button>
    </div>
  );
}
