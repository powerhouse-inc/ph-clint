import { setName } from "document-model";
import type { FormEventHandler, MouseEventHandler } from "react";
import { useState } from "react";
import { useSelectedClaudeChatDocument } from "@powerhousedao/agent-manager/document-models/claude-chat";

/** Displays the name of the selected ClaudeChat document and allows editing it */
export function EditClaudeChatName() {
  const [claudeChatDocument, dispatch] = useSelectedClaudeChatDocument();
  const [isEditing, setIsEditing] = useState(false);

  if (!claudeChatDocument) return null;

  const claudeChatDocumentName = claudeChatDocument.header.name;

  const onClickEditClaudeChatName: MouseEventHandler<
    HTMLButtonElement
  > = () => {
    setIsEditing(true);
  };

  const onClickCancelEditClaudeChatName: MouseEventHandler<
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
          defaultValue={claudeChatDocumentName}
          autoFocus
        />
        <div className="flex gap-2">
          <button type="submit" className="text-sm text-gray-600">
            Save
          </button>
          <button
            className="text-sm text-red-800"
            onClick={onClickCancelEditClaudeChatName}
          >
            Cancel
          </button>
        </div>
      </form>
    );

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-900">
        {claudeChatDocumentName}
      </h2>
      <button
        className="text-sm text-gray-600"
        onClick={onClickEditClaudeChatName}
      >
        Edit Name
      </button>
    </div>
  );
}
