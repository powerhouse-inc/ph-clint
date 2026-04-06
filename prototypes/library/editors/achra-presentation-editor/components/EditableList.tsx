import { generateId } from "document-model/core";
import { EditableText } from "./EditableText.js";
import { useIsPresenting } from "./PresentContext.js";

interface EditableListProps {
  items: Array<{ id: string; text: string }>;
  onAdd: (id: string, text: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  placeholder?: string;
  addLabel?: string;
  renderItem?: (
    item: { id: string; text: string },
    editableText: React.ReactNode,
    deleteButton: React.ReactNode,
    index: number,
  ) => React.ReactNode;
}

export function EditableList({
  items,
  onAdd,
  onUpdate,
  onDelete,
  placeholder = "Click to edit",
  addLabel = "+ Add item",
  renderItem,
}: EditableListProps) {
  const presenting = useIsPresenting();

  const handleAdd = () => {
    onAdd(generateId(), "New item");
  };

  return (
    <>
      {items.map((item, index) => {
        const editableText = (
          <EditableText
            value={item.text}
            onCommit={(text) => onUpdate(item.id, text)}
            placeholder={placeholder}
          />
        );
        const deleteButton = presenting ? null : (
          <button
            className="item-delete"
            onClick={() => onDelete(item.id)}
            title="Remove"
          >
            ×
          </button>
        );

        if (renderItem) {
          return (
            <div key={item.id} className="list-item-wrapper">
              {renderItem(item, editableText, deleteButton, index)}
            </div>
          );
        }

        return (
          <li key={item.id} className="list-item-wrapper">
            <span style={{ flex: 1 }}>{editableText}</span>
            {deleteButton}
          </li>
        );
      })}
      {!presenting && (
        <button className="add-item-btn" onClick={handleAdd} type="button">
          {addLabel}
        </button>
      )}
    </>
  );
}
