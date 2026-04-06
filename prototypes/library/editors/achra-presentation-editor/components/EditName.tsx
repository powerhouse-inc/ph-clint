import { setName } from "document-model";
import type { FormEventHandler, MouseEventHandler } from "react";
import { useState } from "react";
import { useSelectedAchraPresentationDocument } from "@powerhousedao/agent-manager/document-models/achra-presentation";

/** Displays the name of the selected AchraPresentation document and allows editing it */
export function EditAchraPresentationName() {
  const [achraPresentationDocument, dispatch] =
    useSelectedAchraPresentationDocument();
  const [isEditing, setIsEditing] = useState(false);

  if (!achraPresentationDocument) return null;

  const achraPresentationDocumentName = achraPresentationDocument.header.name;

  const onClickEditAchraPresentationName: MouseEventHandler<
    HTMLButtonElement
  > = () => {
    setIsEditing(true);
  };

  const onClickCancelEditAchraPresentationName: MouseEventHandler<
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
          defaultValue={achraPresentationDocumentName}
          autoFocus
        />
        <div className="flex gap-2">
          <button type="submit" className="text-sm text-gray-600">
            Save
          </button>
          <button
            className="text-sm text-red-800"
            onClick={onClickCancelEditAchraPresentationName}
          >
            Cancel
          </button>
        </div>
      </form>
    );

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold text-gray-900">
        {achraPresentationDocumentName}
      </h2>
      <button
        className="text-sm text-gray-600"
        onClick={onClickEditAchraPresentationName}
      >
        Edit Name
      </button>
    </div>
  );
}
