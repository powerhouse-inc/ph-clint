import { DocumentToolbar } from "@powerhousedao/design-system/connect";
import {
  useSelectedPhClintProjectDocument,
  actions,
} from "document-models/ph-clint-project";

function TextField(props: {
  label: string;
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  onCommit: (value: string) => void;
}) {
  return (
    <label className="my-3 block">
      <h3 className="text-base">{props.label}</h3>
      <input
        type="text"
        defaultValue={props.value}
        placeholder={props.placeholder}
        readOnly={props.readOnly}
        onBlur={(e) => {
          const next = e.target.value.trim();
          if (next !== props.value) props.onCommit(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-full font-mono"
      />
    </label>
  );
}

function Toggle(props: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  hint?: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="my-2 flex items-center gap-3">
      <input
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span className="font-semibold">{props.label}</span>
      {props.hint ? (
        <span className="text-sm text-gray-600">{props.hint}</span>
      ) : null}
    </label>
  );
}

export default function Editor() {
  const [document, dispatch] = useSelectedPhClintProjectDocument();
  const state = document.state.global;
  const { powerhouse, mastra, routine } = state.features;

  // identity dispatchers — empty string for optional fields triggers "clear"
  const setPackageName = (name: string) =>
    dispatch(actions.setPackageName({ name }));
  const setScope = (scope: string) => {
    if (scope === "") dispatch(actions.clearScope({ _: true }));
    else dispatch(actions.setScope({ scope }));
  };
  const setVersion = (version: string) =>
    dispatch(actions.setVersion({ version }));
  const setDescription = (description: string) =>
    dispatch(actions.setDescription({ description }));
  const setBin = (bin: string) => {
    if (bin === "") dispatch(actions.clearBin({ _: true }));
    else dispatch(actions.setBin({ bin }));
  };

  // feature dispatchers
  const togglePowerhouse = () => {
    if (!powerhouse.enabled) dispatch(actions.enablePowerhouse({ _: true }));
    // irreversible — no disable path
  };
  const toggleSwitchboard = (enabled: boolean) =>
    dispatch(actions.setPowerhouseSwitchboard({ enabled }));
  const toggleConnect = (enabled: boolean) =>
    dispatch(actions.setPowerhouseConnect({ enabled }));

  const toggleMastra = (enabled: boolean) => {
    if (enabled) dispatch(actions.enableMastra({ _: true }));
    else dispatch(actions.disableMastra({ _: true }));
  };

  const toggleRoutine = (enabled: boolean) => {
    if (enabled) dispatch(actions.enableRoutine({ _: true }));
    else dispatch(actions.disableRoutine({ _: true }));
  };

  return (
    <div className="mx-auto max-w-4xl bg-gray-50 p-6">
      <DocumentToolbar />

      <div className="ph-default-styles">
        <h2 className="mt-4 text-xl font-bold">ph-clint Project Spec</h2>

        {/* Identity */}
        <section className="my-6">
          <h3 className="text-lg font-semibold">Identity</h3>
          <TextField
            label="Package name"
            value={state.name ?? ""}
            placeholder="my-clint-cli"
            onCommit={setPackageName}
          />
          <TextField
            label="Scope (optional)"
            value={state.scope ?? ""}
            placeholder="e.g. my-org (leave empty for unscoped)"
            onCommit={setScope}
          />
          <TextField
            label="Version"
            value={state.version}
            placeholder="0.1.0"
            onCommit={setVersion}
          />
          <TextField
            label="Description"
            value={state.description}
            placeholder="What this CLI does"
            onCommit={setDescription}
          />
          <TextField
            label="Bin name (optional)"
            value={state.bin ?? ""}
            placeholder="defaults to package name"
            onCommit={setBin}
          />
        </section>

        <hr />

        {/* Features */}
        <section className="my-6">
          <h3 className="text-lg font-semibold">Features</h3>

          <div className="my-4 rounded border border-gray-200 bg-white p-4">
            <Toggle
              label="Powerhouse"
              checked={powerhouse.enabled}
              disabled={powerhouse.enabled}
              hint={
                powerhouse.enabled
                  ? "enabled (irreversible — ph-clint app split cannot be undone)"
                  : "one-way switch — enabling splits the repo into ph-clint-cli + ph-clint-app"
              }
              onChange={togglePowerhouse}
            />
            {powerhouse.enabled ? (
              <div className="ml-8 mt-2">
                <Toggle
                  label="Switchboard"
                  checked={powerhouse.switchboard}
                  onChange={toggleSwitchboard}
                />
                <Toggle
                  label="Connect"
                  checked={powerhouse.connect}
                  onChange={toggleConnect}
                />
              </div>
            ) : null}
          </div>

          <div className="my-4 rounded border border-gray-200 bg-white p-4">
            <Toggle
              label="Mastra"
              checked={mastra.enabled}
              hint={
                mastra.enabled
                  ? "agent framework active — also forces routine loop on"
                  : "enable AI agent framework (will auto-enable routine)"
              }
              onChange={toggleMastra}
            />
          </div>

          <div className="my-4 rounded border border-gray-200 bg-white p-4">
            <Toggle
              label="Routine loop"
              checked={routine.enabled}
              disabled={mastra.enabled && routine.enabled}
              hint={
                mastra.enabled && routine.enabled
                  ? "required by Mastra — disable Mastra first"
                  : "tick-based execution loop with triggers"
              }
              onChange={toggleRoutine}
            />
          </div>
        </section>

        <hr />

        {/* Document header info */}
        <section className="my-6 grid grid-cols-2 gap-x-8">
          <label>
            <h3 className="text-base">Document ID</h3>
            <input
              type="text"
              value={document.header.id}
              readOnly
              className="font-mono"
            />
          </label>
          <label>
            <h3 className="text-base">Type</h3>
            <input type="text" value={document.header.documentType} readOnly />
          </label>
        </section>
      </div>
    </div>
  );
}
