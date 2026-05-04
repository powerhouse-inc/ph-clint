import { useCallback, useRef, useState } from 'react';
import { generateId } from 'document-model';
import { DocumentToolbar } from '@powerhousedao/design-system/connect';
import { useSelectedPhClintProjectDocument, actions } from 'document-models/ph-clint-project';
import type { PowerhouseLevel, PowerhousePackage, ExternalSkill, PublishRecord, PhClintProjectState, PhClintMastraFeature, PhClintAgentModel, PhClintAgentProfile, PhClintDeployment } from '../../document-models/ph-clint-project/v1/gen/types.js';

const POWERHOUSE_LEVELS: { value: PowerhouseLevel; description: string }[] = [
  { value: 'Disabled', description: 'No Powerhouse integration' },
  { value: 'Reactor', description: 'Document model runtime' },
  { value: 'Switchboard', description: 'API service (GraphQL + MCP)' },
  { value: 'Connect', description: 'Web UI for document management' },
];

function TextField(props: { label: string; value: string; placeholder?: string; readOnly?: boolean; compact?: boolean; onCommit: (value: string) => void }) {
  return (
    <label className={props.compact ? 'my-1 block' : 'my-3 block'}>
      <h3 className={props.compact ? 'text-xs text-gray-600' : 'text-base'}>{props.label}</h3>
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
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="w-full font-mono"
      />
    </label>
  );
}

function Toggle(props: { label: string; checked: boolean; disabled?: boolean; hint?: string; onChange: (next: boolean) => void }) {
  return (
    <label className="my-2 flex items-center gap-3">
      <input type="checkbox" checked={props.checked} disabled={props.disabled} onChange={(e) => props.onChange(e.target.checked)} />
      <span className="font-semibold">{props.label}</span>
      {props.hint ? <span className="text-sm text-gray-600">{props.hint}</span> : null}
    </label>
  );
}

type Tab = 'spec' | 'agent' | 'powerhouse' | 'skills' | 'publish';

export default function Editor() {
  const [document, dispatch] = useSelectedPhClintProjectDocument();
  const state = document.state.global;
  const { powerhouse, mastra, routine } = state.features;
  const [activeTab, setActiveTab] = useState<Tab>('spec');

  // identity dispatchers
  const setPackageIdentifier = (identifier: string) => dispatch(actions.setPackageIdentifier({ identifier }));
  const setVersion = (version: string) => dispatch(actions.setVersion({ version }));
  const setDescription = (description: string) => dispatch(actions.setDescription({ description }));

  // feature dispatchers
  const setPowerhouseLevel = (level: PowerhouseLevel) => dispatch(actions.setPowerhouseLevel({ level }));
  const toggleMastra = (enabled: boolean) => {
    if (enabled) {
      const baseName = state.name || 'my-agent';
      const agentId = `${baseName}-agent`;
      const agentName = `${baseName.charAt(0).toUpperCase()}${baseName.slice(1).replace(/-([a-z])/g, (_, c: string) => ` ${c.toUpperCase()}`)} Agent`;
      dispatch(actions.enableMastra({ agentId, agentName }));
    } else {
      dispatch(actions.disableMastra({ _: true }));
    }
  };
  const toggleRoutine = (enabled: boolean) => {
    if (enabled) dispatch(actions.enableRoutine({ _: true }));
    else dispatch(actions.disableRoutine({ _: true }));
  };

  // package dispatchers
  const addPackage = (packageName: string) => dispatch(actions.addPowerhousePackage({ id: generateId(), packageName }));
  const removePackage = (id: string) => dispatch(actions.removePowerhousePackage({ id }));
  const addDocType = (packageId: string, documentType: string) => dispatch(actions.addPackageDocumentType({ packageId, documentType }));
  const removeDocType = (packageId: string, documentType: string) => dispatch(actions.removePackageDocumentType({ packageId, documentType }));

  // skill dispatchers
  const addSkill = (name: string, githubUrl: string) => dispatch(actions.addExternalSkill({ id: generateId(), name, githubUrl }));
  const removeSkill = (id: string) => dispatch(actions.removeExternalSkill({ id }));

  // publish dispatchers
  const bumpVersion = (version: string) => dispatch(actions.bumpVersion({ version }));
  const publishDev = () => dispatch(actions.publishDev({ id: generateId(), timestamp: new Date().toISOString() }));
  const publishStaging = () => dispatch(actions.publishStaging({ id: generateId(), timestamp: new Date().toISOString() }));
  const publishProduction = () => dispatch(actions.publishProduction({ id: generateId(), timestamp: new Date().toISOString() }));

  // agent dispatchers
  const setAgentId = (agentId: string) => dispatch(actions.setAgentId({ agentId }));
  const setAgentName = (agentName: string) => dispatch(actions.setAgentName({ agentName }));
  const addModel = (id: string, isDefault?: boolean) => dispatch(actions.addModel({ id, isDefault }));
  const removeModel = (id: string) => dispatch(actions.removeModel({ id }));
  const setDefaultModel = (id: string) => dispatch(actions.setDefaultModel({ id }));
  const addProfile = (id: string, title: string, content: string, insertBefore?: string) => dispatch(actions.addProfile({ id, title, content, insertBefore }));
  const updateProfile = (id: string, title?: string, content?: string) => dispatch(actions.updateProfile({ id, title, content }));
  const removeProfile = (id: string) => dispatch(actions.removeProfile({ id }));
  const reorderProfiles = (ids: string[], insertBefore: string | null) => dispatch(actions.reorderProfiles({ ids, insertBefore }));
  const setAgentDescription = (description: string) => dispatch(actions.setAgentDescription({ description }));
  const setAgentImage = (image: string) => dispatch(actions.setAgentImage({ image }));
  const clearAgentImage = () => dispatch(actions.clearAgentImage({ _: true }));
  const setEnableChat = (enabled: boolean) => dispatch(actions.setEnableChat({ enabled }));

  // deployment dispatchers
  const setProxyEnabled = (enabled: boolean) => dispatch(actions.setProxyEnabled({ enabled }));
  const addSupportedResource = (resource: string) => dispatch(actions.addSupportedResource({ resource }));
  const removeSupportedResource = (resource: string) => dispatch(actions.removeSupportedResource({ resource }));

  const isAboveDisabled = powerhouse !== 'Disabled';

  const tabClasses = (tab: Tab) => `px-4 py-2 text-sm font-medium border-b-2 cursor-pointer ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="mx-auto max-w-4xl bg-gray-50 p-6">
      <DocumentToolbar />

      <div className="ph-default-styles">
        <h2 className="mt-4 text-xl font-bold">ph-clint Project Spec</h2>

        <nav className="my-4 flex border-b border-gray-200">
          <button className={tabClasses('spec')} onClick={() => setActiveTab('spec')}>
            CLI
          </button>
          <button className={tabClasses('agent')} onClick={() => setActiveTab('agent')}>
            Agent
          </button>
          <button className={tabClasses('powerhouse')} onClick={() => setActiveTab('powerhouse')}>
            Powerhouse
          </button>
          <button className={tabClasses('skills')} onClick={() => setActiveTab('skills')}>
            Skills
          </button>
          <button className={tabClasses('publish')} onClick={() => setActiveTab('publish')}>
            Publish
          </button>
        </nav>

        {activeTab === 'spec' && (
          <SpecTab
            state={state}
            powerhouse={powerhouse}
            mastra={mastra}
            routine={routine}
            isAboveDisabled={isAboveDisabled}
            setPackageIdentifier={setPackageIdentifier}
            setVersion={setVersion}
            setDescription={setDescription}
            setPowerhouseLevel={setPowerhouseLevel}
            toggleMastra={toggleMastra}
            toggleRoutine={toggleRoutine}
          />
        )}

        {activeTab === 'agent' && (
          <AgentTab
            mastra={mastra}
            isAboveDisabled={isAboveDisabled}
            setAgentId={setAgentId}
            setAgentName={setAgentName}
            setAgentDescription={setAgentDescription}
            setAgentImage={setAgentImage}
            clearAgentImage={clearAgentImage}
            setEnableChat={setEnableChat}
            addModel={addModel}
            removeModel={removeModel}
            setDefaultModel={setDefaultModel}
            addProfile={addProfile}
            updateProfile={updateProfile}
            removeProfile={removeProfile}
            reorderProfiles={reorderProfiles}
          />
        )}

        {activeTab === 'powerhouse' && <PowerhouseTab packages={state.packages} isAboveDisabled={isAboveDisabled} addPackage={addPackage} removePackage={removePackage} addDocType={addDocType} removeDocType={removeDocType} />}

        {activeTab === 'skills' && <SkillsTab skills={state.externalSkills} addSkill={addSkill} removeSkill={removeSkill} />}

        {activeTab === 'publish' && (
          <PublishTab
            version={state.version}
            publishHistory={state.publishHistory}
            documentHeader={document.header}
            deployment={state.deployment}
            bumpVersion={bumpVersion}
            publishDev={publishDev}
            publishStaging={publishStaging}
            publishProduction={publishProduction}
            setProxyEnabled={setProxyEnabled}
            addSupportedResource={addSupportedResource}
            removeSupportedResource={removeSupportedResource}
          />
        )}
      </div>
    </div>
  );
}

/* ── Spec Tab ─────────────────────────────────────────────────── */

function SpecTab(props: {
  state: PhClintProjectState;
  powerhouse: PowerhouseLevel;
  mastra: PhClintMastraFeature;
  routine: { enabled: boolean };
  isAboveDisabled: boolean;
  setPackageIdentifier: (identifier: string) => void;
  setVersion: (version: string) => void;
  setDescription: (description: string) => void;
  setPowerhouseLevel: (level: PowerhouseLevel) => void;
  toggleMastra: (enabled: boolean) => void;
  toggleRoutine: (enabled: boolean) => void;
}) {
  const { state } = props;
  const packageIdentifier = `${state.scope ? state.scope + '/' : ''}${state.name ?? ''}`;

  return (
    <>
      {/* Identity */}
      <section className="my-6">
        <h3 className="text-lg font-semibold">Identity</h3>
        <div className="grid grid-cols-[3fr_1fr] gap-4">
          <TextField label="Package name" value={packageIdentifier} placeholder="@scope/my-tool-cli" onCommit={props.setPackageIdentifier} />
          <TextField label="Version" value={state.version} placeholder="0.1.0" onCommit={props.setVersion} />
        </div>
        <TextField label="Description" value={state.description} placeholder="What this CLI does" onCommit={props.setDescription} />
      </section>

      <hr />

      {/* Features */}
      <section className="my-6">
        <h3 className="text-lg font-semibold">Features</h3>

        {/* Powerhouse — radio buttons */}
        <div className="my-4 rounded border border-gray-200 bg-white p-4">
          <h4 className="text-base font-semibold">Powerhouse</h4>
          {props.isAboveDisabled && <p className="text-sm text-gray-500">Cannot go back to Disabled once enabled</p>}
          <div className="mt-2 space-y-2">
            {POWERHOUSE_LEVELS.map((level, i) => (
              <label key={level.value} className="flex items-start gap-2">
                {i > 0 && <div className="absolute -mt-3 ml-[7px] h-3 border-l border-gray-300" />}
                <input type="radio" name="powerhouse-level" checked={props.powerhouse === level.value} disabled={props.isAboveDisabled && level.value === 'Disabled'} onChange={() => props.setPowerhouseLevel(level.value)} className="mt-0.5" />
                <div>
                  <span className="font-medium">{level.value}</span>
                  <span className="ml-2 text-sm text-gray-500">{level.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="my-4 rounded border border-gray-200 bg-white p-4">
          <Toggle label="Mastra" checked={props.mastra.enabled} hint="AI agent framework" onChange={props.toggleMastra} />
        </div>

        <div className="my-4 rounded border border-gray-200 bg-white p-4">
          <Toggle label="Routine loop" checked={props.routine.enabled} hint="tick-based execution loop with triggers" onChange={props.toggleRoutine} />
        </div>
      </section>
    </>
  );
}

/* ── Powerhouse Tab ──────────────────────────────────────────── */

function PowerhouseTab(props: {
  packages: PowerhousePackage[];
  isAboveDisabled: boolean;
  addPackage: (packageName: string) => void;
  removePackage: (id: string) => void;
  addDocType: (packageId: string, documentType: string) => void;
  removeDocType: (packageId: string, documentType: string) => void;
}) {
  if (!props.isAboveDisabled) {
    return (
      <section className="my-6 rounded border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        <h3 className="text-lg font-semibold">Powerhouse</h3>
        <p className="mt-2">Enable Powerhouse in the Spec tab (set level to Reactor or above) to manage packages.</p>
      </section>
    );
  }

  return <PackagesSection packages={props.packages} addPackage={props.addPackage} removePackage={props.removePackage} addDocType={props.addDocType} removeDocType={props.removeDocType} />;
}

/* ── Agent Tab ────────────────────────────────────────────────── */

function AgentTab(props: {
  mastra: PhClintMastraFeature;
  isAboveDisabled: boolean;
  setAgentId: (agentId: string) => void;
  setAgentName: (agentName: string) => void;
  setAgentDescription: (description: string) => void;
  setAgentImage: (image: string) => void;
  clearAgentImage: () => void;
  setEnableChat: (enabled: boolean) => void;
  addModel: (id: string, isDefault?: boolean) => void;
  removeModel: (id: string) => void;
  setDefaultModel: (id: string) => void;
  addProfile: (id: string, title: string, content: string, insertBefore?: string) => void;
  updateProfile: (id: string, title?: string, content?: string) => void;
  removeProfile: (id: string) => void;
  reorderProfiles: (ids: string[], insertBefore: string | null) => void;
}) {
  const { mastra } = props;

  if (!mastra.enabled) {
    return (
      <section className="my-6 rounded border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        <h3 className="text-lg font-semibold">Agent</h3>
        <p className="mt-2">Enable Mastra in the Spec tab to configure the agent.</p>
      </section>
    );
  }

  return (
    <>
      {/* Agent Identity */}
      <section className="my-6">
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ flexShrink: 0, width: '7rem' }}>
            <AgentImageField image={mastra.agentImage ?? null} onSetImage={props.setAgentImage} onClearImage={props.clearAgentImage} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              <TextField compact label="Agent ID" value={mastra.agentId ?? ''} placeholder="my-agent" onCommit={props.setAgentId} />
              <TextField compact label="Agent Name" value={mastra.agentName ?? ''} placeholder="My Agent" onCommit={props.setAgentName} />
            </div>
            <TextField compact label="Agent Description" value={mastra.agentDescription ?? ''} placeholder="A brief description of what this agent does" onCommit={props.setAgentDescription} />
          </div>
        </div>
      </section>

      <hr />

      {/* Models */}
      <ModelsSection models={mastra.models} addModel={props.addModel} removeModel={props.removeModel} setDefaultModel={props.setDefaultModel} />

      <hr />

      {/* Profiles */}
      <ProfilesSection profiles={mastra.profiles} addProfile={props.addProfile} updateProfile={props.updateProfile} removeProfile={props.removeProfile} reorderProfiles={props.reorderProfiles} />

      <hr />

      {/* Common */}
      <section className="my-6">
        <h3 className="text-lg font-semibold">Common</h3>
        <div className="my-3 rounded border border-gray-200 bg-white p-4">
          <Toggle
            label="Enable Chat"
            checked={mastra.common.enableChat}
            disabled={!props.isAboveDisabled}
            hint={props.isAboveDisabled ? 'Chat session integration via clint-common' : 'Requires Powerhouse to be enabled'}
            onChange={props.setEnableChat}
          />
        </div>
      </section>
    </>
  );
}

function AgentImageField(props: { image: string | null; onSetImage: (dataUrl: string) => void; onClearImage: () => void }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragDepthRef = useRef(0);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') props.onSetImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Must stopPropagation on all drag events to prevent Connect's DropZone
  // from intercepting and blocking non-.phd file drops (see editor-drag-drop.md)
  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.stopPropagation();
      dragDepthRef.current += 1;
      if (dragDepthRef.current === 1) setIsDragOver(true);
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.stopPropagation();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragOver(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    }
  }, []);

  const SIZE = '7rem';

  return (
    <div style={{ width: SIZE, height: SIZE, flexShrink: 0 }} className="relative my-3">
      {props.image ? (
        <>
          <img src={props.image} alt="Agent" style={{ width: SIZE, height: SIZE }} className="rounded border border-gray-200 object-cover" />
          <div className="mt-1 flex justify-center gap-1">
            <label className="cursor-pointer rounded bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200">
              Replace
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
            </label>
            <button className="rounded bg-gray-100 px-2 py-0.5 text-xs text-red-600 hover:bg-gray-200" onClick={props.onClearImage}>
              Remove
            </button>
          </div>
        </>
      ) : (
        <div
          style={{ width: SIZE, height: SIZE }}
          className={`flex flex-col items-center justify-center rounded border-2 border-dashed text-center ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'}`}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <label className="cursor-pointer p-2 text-xs text-gray-500 hover:text-blue-600">
            Drop image or click
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

function ModelsSection(props: { models: PhClintAgentModel[]; addModel: (id: string, isDefault?: boolean) => void; removeModel: (id: string) => void; setDefaultModel: (id: string) => void }) {
  const [newModelId, setNewModelId] = useState('');

  const handleAdd = () => {
    const id = newModelId.trim();
    if (id) {
      props.addModel(id);
      setNewModelId('');
    }
  };

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold">Models</h3>
      <p className="text-sm text-gray-600">Provider/model format (e.g. anthropic/claude-sonnet-4-5). Exactly one must be default.</p>

      {props.models.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-1">Default</th>
              <th className="py-1">Model</th>
              <th className="py-1">Provider</th>
              <th className="py-1" />
            </tr>
          </thead>
          <tbody>
            {props.models.map((m) => {
              const provider = m.id.split('/')[0];
              return (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="py-2">
                    <input type="radio" name="default-model" checked={m.isDefault} onChange={() => props.setDefaultModel(m.id)} />
                  </td>
                  <td className="py-2 font-mono">{m.id}</td>
                  <td className="py-2 text-gray-500">{provider}</td>
                  <td className="py-2 text-right">
                    <button className="text-red-500 hover:text-red-700" onClick={() => props.removeModel(m.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="provider/model-name"
          value={newModelId}
          onChange={(e) => setNewModelId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          className="flex-1 rounded border p-2 font-mono text-sm"
        />
        <button className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50" disabled={!newModelId.trim()} onClick={handleAdd}>
          Add Model
        </button>
      </div>
    </section>
  );
}

function ProfilesSection(props: {
  profiles: PhClintAgentProfile[];
  addProfile: (id: string, title: string, content: string, insertBefore?: string) => void;
  updateProfile: (id: string, title?: string, content?: string) => void;
  removeProfile: (id: string) => void;
  reorderProfiles: (ids: string[], insertBefore: string | null) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    const id = newId.trim();
    const title = newTitle.trim();
    if (id && title) {
      props.addProfile(id, title, '');
      setNewId('');
      setNewTitle('');
      setShowAddForm(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const id = props.profiles[index].id;
    const beforeId = props.profiles[index - 1].id;
    props.reorderProfiles([id], beforeId);
  };

  const moveDown = (index: number) => {
    if (index >= props.profiles.length - 1) return;
    const id = props.profiles[index].id;
    const afterNext = index + 2 < props.profiles.length ? props.profiles[index + 2].id : null;
    props.reorderProfiles([id], afterNext);
  };

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold">Agent Profiles</h3>
      <p className="text-sm text-gray-600">Markdown sections that compose into the agent&apos;s instructions. Order matters.</p>

      {props.profiles.map((profile, i) => (
        <div key={profile.id} className="my-3 rounded border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">{profile.id}</span>
              <input
                type="text"
                defaultValue={profile.title}
                onBlur={(e) => {
                  const next = e.target.value.trim();
                  if (next && next !== profile.title) props.updateProfile(profile.id, next);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                className="border-b border-transparent font-semibold hover:border-gray-300 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <button className="px-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" disabled={i === 0} onClick={() => moveUp(i)} title="Move up">
                ↑
              </button>
              <button className="px-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" disabled={i === props.profiles.length - 1} onClick={() => moveDown(i)} title="Move down">
                ↓
              </button>
              <button className="ml-2 text-sm text-red-500 hover:text-red-700" onClick={() => props.removeProfile(profile.id)}>
                Remove
              </button>
            </div>
          </div>
          <textarea
            defaultValue={profile.content}
            onBlur={(e) => {
              const next = e.target.value;
              if (next !== profile.content) props.updateProfile(profile.id, undefined, next);
            }}
            placeholder="Markdown content for this profile section..."
            rows={4}
            className="mt-2 w-full rounded border border-gray-200 p-2 font-mono text-sm"
          />
        </div>
      ))}

      {showAddForm ? (
        <div className="my-3 rounded border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <input type="text" placeholder="section-id" value={newId} onChange={(e) => setNewId(e.target.value)} className="w-40 rounded border p-2 font-mono text-sm" />
            <input
              type="text"
              placeholder="Section Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              className="flex-1 rounded border p-2 text-sm"
            />
            <button className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50" disabled={!newId.trim() || !newTitle.trim()} onClick={handleAdd}>
              Add
            </button>
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowAddForm(false);
                setNewId('');
                setNewTitle('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="mt-3 rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600" onClick={() => setShowAddForm(true)}>
          + Add Profile
        </button>
      )}
    </section>
  );
}

/* ── Skills Tab ───────────────────────────────────────────────── */

function SkillsTab(props: { skills: ExternalSkill[]; addSkill: (name: string, githubUrl: string) => void; removeSkill: (id: string) => void }) {
  return (
    <>
      {/* Skill Templates placeholder */}
      <section className="my-6 rounded border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        <h3 className="text-lg font-semibold">Skill Templates</h3>
        <p className="mt-2">Coming soon</p>
      </section>

      <hr />

      {/* External Skills — moved from Spec tab */}
      <ExternalSkillsSection skills={props.skills} addSkill={props.addSkill} removeSkill={props.removeSkill} />
    </>
  );
}

function ExternalSkillsSection(props: { skills: ExternalSkill[]; addSkill: (name: string, githubUrl: string) => void; removeSkill: (id: string) => void }) {
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    if (newName.trim() && newUrl.trim()) {
      props.addSkill(newName.trim(), newUrl.trim());
      setNewName('');
      setNewUrl('');
    }
  };

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold">External Skills</h3>
      <p className="text-sm text-gray-600">Skills from the skills.sh ecosystem, installed via GitHub URL.</p>

      {props.skills.length > 0 && (
        <ul className="mt-3 space-y-2">
          {props.skills.map((skill) => (
            <li key={skill.id} className="flex items-center justify-between rounded border border-gray-200 bg-white p-3">
              <div>
                <span className="font-mono font-semibold">{skill.name}</span>
                <span className="ml-2 text-sm text-gray-500">{skill.githubUrl}</span>
              </div>
              <button className="text-sm text-red-500 hover:text-red-700" onClick={() => props.removeSkill(skill.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-2">
        <input type="text" placeholder="skill-name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-40 rounded border p-2 font-mono text-sm" />
        <input
          type="text"
          placeholder="https://github.com/org/repo"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          className="flex-1 rounded border p-2 font-mono text-sm"
        />
        <button className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50" disabled={!newName.trim() || !newUrl.trim()} onClick={handleAdd}>
          Add Skill
        </button>
      </div>
    </section>
  );
}

/* ── Publish Tab ──────────────────────────────────────────────── */

function PublishTab(props: {
  version: string;
  publishHistory: PublishRecord[];
  documentHeader: { id: string; documentType: string };
  deployment: PhClintDeployment;
  bumpVersion: (version: string) => void;
  publishDev: () => void;
  publishStaging: () => void;
  publishProduction: () => void;
  setProxyEnabled: (enabled: boolean) => void;
  addSupportedResource: (resource: string) => void;
  removeSupportedResource: (resource: string) => void;
}) {
  const recentHistory = props.publishHistory.slice(-5).reverse();

  return (
    <>
      <section className="my-6">
        <h3 className="text-lg font-semibold">Publishing</h3>

        <div className="my-3 rounded border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Current version:</span>
            <span className="font-mono font-semibold">{props.version}</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button className="rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700" onClick={props.publishDev}>
              Publish Dev
            </button>
            <button className="rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700" onClick={props.publishStaging}>
              Publish Staging
            </button>
            <button className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700" onClick={props.publishProduction}>
              Publish Production
            </button>
          </div>
        </div>

        {recentHistory.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-gray-600">Recent publish history</h4>
            <ul className="mt-2 space-y-1">
              {recentHistory.map((r) => (
                <li key={r.id} className="flex items-center gap-3 text-sm">
                  <StatusBadge status={r.status} />
                  <span className="font-mono">{r.version}</span>
                  <span className="text-gray-500">{r.tag}</span>
                  <span className="text-gray-400">{r.timestamp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <hr />

      {/* Deployment */}
      <DeploymentSection deployment={props.deployment} setProxyEnabled={props.setProxyEnabled} addSupportedResource={props.addSupportedResource} removeSupportedResource={props.removeSupportedResource} />

      <hr />

      {/* Document Metadata */}
      <section className="my-6 grid grid-cols-2 gap-x-8">
        <label>
          <h3 className="text-base">Document ID</h3>
          <input type="text" value={props.documentHeader.id} readOnly className="font-mono" />
        </label>
        <label>
          <h3 className="text-base">Type</h3>
          <input type="text" value={props.documentHeader.documentType} readOnly />
        </label>
      </section>
    </>
  );
}

/* ── Deployment Section ───────────────────────────────────────── */

const KNOWN_RESOURCES = ['vetra-agent-s', 'vetra-agent-m', 'vetra-agent-l', 'vetra-agent-xl', 'vetra-agent-xxl'];

function DeploymentSection(props: { deployment: PhClintDeployment; setProxyEnabled: (enabled: boolean) => void; addSupportedResource: (resource: string) => void; removeSupportedResource: (resource: string) => void }) {
  const [newResource, setNewResource] = useState('');
  const { deployment } = props;
  const customResources = deployment.supportedResources.filter((r) => !KNOWN_RESOURCES.includes(r));

  const handleAddCustom = () => {
    const resource = newResource.trim();
    if (resource) {
      props.addSupportedResource(resource);
      setNewResource('');
    }
  };

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold">Deployment</h3>

      <div className="my-3 rounded border border-gray-200 bg-white p-4">
        <Toggle label="Proxy" checked={deployment.proxyEnabled} hint="Run a reverse proxy that exposes all service endpoints through a single port" onChange={props.setProxyEnabled} />
      </div>

      <div className="my-3 rounded border border-gray-200 bg-white p-4">
        <h4 className="text-base font-semibold">Supported Resources</h4>
        <p className="text-sm text-gray-600">Resource tiers this project supports.</p>

        <div className="mt-3 space-y-1">
          {KNOWN_RESOURCES.map((resource) => {
            const checked = deployment.supportedResources.includes(resource);
            return (
              <label key={resource} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) props.removeSupportedResource(resource);
                    else props.addSupportedResource(resource);
                  }}
                />
                <span className="font-mono text-sm">{resource}</span>
              </label>
            );
          })}
        </div>

        {customResources.length > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <h5 className="text-sm font-medium text-gray-600">Custom resources</h5>
            <ul className="mt-1 space-y-1">
              {customResources.map((resource) => (
                <li key={resource} className="flex items-center gap-2 text-sm">
                  <span className="font-mono">{resource}</span>
                  <button className="text-xs text-red-400 hover:text-red-600" onClick={() => props.removeSupportedResource(resource)}>
                    x
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="custom-resource"
            value={newResource}
            onChange={(e) => setNewResource(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCustom();
            }}
            className="flex-1 rounded border p-2 font-mono text-sm"
          />
          <button className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50" disabled={!newResource.trim()} onClick={handleAddCustom}>
            Add
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Shared Components ────────────────────────────────────────── */

function PackagesSection(props: {
  packages: PowerhousePackage[];
  addPackage: (packageName: string) => void;
  removePackage: (id: string) => void;
  addDocType: (packageId: string, documentType: string) => void;
  removeDocType: (packageId: string, documentType: string) => void;
}) {
  const [newPkgName, setNewPkgName] = useState('');

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold">Powerhouse Packages</h3>
      <p className="text-sm text-gray-600">Reactor packages and their document types. Managed packages are framework-controlled.</p>

      {props.packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} addDocType={props.addDocType} removeDocType={props.removeDocType} removePackage={props.removePackage} />
      ))}

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="@org/package-name"
          value={newPkgName}
          onChange={(e) => setNewPkgName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newPkgName.trim()) {
              props.addPackage(newPkgName.trim());
              setNewPkgName('');
            }
          }}
          className="flex-1 rounded border p-2 font-mono text-sm"
        />
        <button
          className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={!newPkgName.trim()}
          onClick={() => {
            props.addPackage(newPkgName.trim());
            setNewPkgName('');
          }}
        >
          Add Package
        </button>
      </div>
    </section>
  );
}

function PackageCard(props: { pkg: PowerhousePackage; addDocType: (packageId: string, documentType: string) => void; removeDocType: (packageId: string, documentType: string) => void; removePackage: (id: string) => void }) {
  const [newDocType, setNewDocType] = useState('');
  const { pkg } = props;
  const hasWildcard = pkg.documentTypes.includes('*/*');

  return (
    <div className="my-3 rounded border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono font-semibold">{pkg.packageName}</span>
          {pkg.managed && <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">managed</span>}
          {pkg.version && <span className="ml-2 text-xs text-gray-500">v{pkg.version}</span>}
        </div>
        {!pkg.managed && (
          <button className="text-sm text-red-500 hover:text-red-700" onClick={() => props.removePackage(pkg.id)}>
            Remove
          </button>
        )}
      </div>

      {pkg.documentTypes.length > 0 && (
        <ul className="mt-2 space-y-1">
          {pkg.documentTypes.map((dt) => (
            <li key={dt} className="flex items-center gap-2 text-sm">
              <span className="font-mono">{dt === '*/*' ? 'All document models' : dt}</span>
              <button className="text-xs text-red-400 hover:text-red-600" onClick={() => props.removeDocType(pkg.id, dt)}>
                x
              </button>
            </li>
          ))}
        </ul>
      )}

      {!hasWildcard && <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          placeholder="org/document-type"
          value={newDocType}
          onChange={(e) => setNewDocType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newDocType.trim()) {
              props.addDocType(pkg.id, newDocType.trim());
              setNewDocType('');
            }
          }}
          className="flex-1 rounded border p-1 font-mono text-sm"
        />
        <button
          className="text-sm text-blue-500 hover:text-blue-700 disabled:opacity-50"
          disabled={!newDocType.trim()}
          onClick={() => {
            props.addDocType(pkg.id, newDocType.trim());
            setNewDocType('');
          }}
        >
          + doc type
        </button>
      </div>}
    </div>
  );
}

function StatusBadge(props: { status: string }) {
  const colors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-700',
    InProgress: 'bg-blue-100 text-blue-700',
    Succeeded: 'bg-green-100 text-green-700',
    Failed: 'bg-red-100 text-red-700',
  };
  return <span className={`rounded px-2 py-0.5 text-xs ${colors[props.status] ?? 'bg-gray-100 text-gray-700'}`}>{props.status}</span>;
}
