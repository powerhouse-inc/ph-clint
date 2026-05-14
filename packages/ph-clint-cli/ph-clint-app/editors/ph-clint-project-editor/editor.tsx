import { useCallback, useRef, useState } from 'react';
import { generateId } from 'document-model';
import { DocumentToolbar } from '@powerhousedao/design-system/connect';
import { useSelectedPhClintProjectDocument, actions } from 'document-models/ph-clint-project';
import type {
  PowerhouseLevel,
  PowerhousePackage,
  ExternalSkill,
  PublishRecord,
  PhClintProjectState,
  PhClintMastraFeature,
  PhClintMainAgent,
  PhClintSubAgent,
  PhClintAgentModel,
  PhClintAgentProfile,
  PhClintDeployment,
} from '../../document-models/ph-clint-project/v1/gen/types.js';

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

  // external-skill dispatchers
  const addSkill = (name: string, githubUrl: string) => dispatch(actions.addExternalSkill({ id: generateId(), name, githubUrl }));
  const removeSkill = (id: string) => dispatch(actions.removeExternalSkill({ id }));

  // publish dispatchers
  const bumpVersion = (version: string) => dispatch(actions.bumpVersion({ version }));
  const publishDev = () => dispatch(actions.publishDev({ id: generateId(), timestamp: new Date().toISOString() }));
  const publishStaging = () => dispatch(actions.publishStaging({ id: generateId(), timestamp: new Date().toISOString() }));
  const publishProduction = () => dispatch(actions.publishProduction({ id: generateId(), timestamp: new Date().toISOString() }));

  // main agent dispatchers
  const setMainAgentName = (name: string) => dispatch(actions.setMainAgentName({ name }));
  const setMainAgentDescription = (description: string) => dispatch(actions.setMainAgentDescription({ description }));
  const clearMainAgentDescription = () => dispatch(actions.clearMainAgentDescription({ _: true }));
  const setMainAgentImage = (image: string) => dispatch(actions.setMainAgentImage({ image }));
  const clearMainAgentImage = () => dispatch(actions.clearMainAgentImage({ _: true }));

  // sub agent dispatchers
  const addSubAgent = (id: string, name: string, description: string, modelId: string) =>
    dispatch(actions.addSubAgent({ id, name, description, modelId }));
  const removeSubAgent = (id: string) => dispatch(actions.removeSubAgent({ id }));
  const setSubAgentName = (id: string, name: string) => dispatch(actions.setSubAgentName({ id, name }));
  const setSubAgentDescription = (id: string, description: string) => dispatch(actions.setSubAgentDescription({ id, description }));

  // library dispatchers
  const addModel = (id: string, isDefault?: boolean) => dispatch(actions.addModel({ id, isDefault }));
  const removeModel = (id: string) => dispatch(actions.removeModel({ id }));
  const setDefaultModel = (id: string) => dispatch(actions.setDefaultModel({ id }));
  const addProfile = (id: string, title: string, content: string, insertBefore?: string) =>
    dispatch(actions.addProfile({ id, title, content, insertBefore }));
  const updateProfile = (id: string, title?: string, content?: string) => dispatch(actions.updateProfile({ id, title, content }));
  const removeProfile = (id: string) => dispatch(actions.removeProfile({ id }));
  const reorderProfiles = (ids: string[], insertBefore: string | null) => dispatch(actions.reorderProfiles({ ids, insertBefore }));

  // per-agent binding dispatchers
  const setAgentModel = (agentId: string, modelId: string) => dispatch(actions.setAgentModel({ agentId, modelId }));
  const addAgentProfileRef = (agentId: string, profileId: string, insertBefore?: string) =>
    dispatch(actions.addAgentProfileRef({ agentId, profileId, insertBefore }));
  const removeAgentProfileRef = (agentId: string, profileId: string) =>
    dispatch(actions.removeAgentProfileRef({ agentId, profileId }));
  const reorderAgentProfileRefs = (agentId: string, ids: string[], insertBefore: string | null) =>
    dispatch(actions.reorderAgentProfileRefs({ agentId, ids, insertBefore }));
  const addAgentSkill = (agentId: string, name: string) => dispatch(actions.addAgentSkill({ agentId, name }));
  const removeAgentSkill = (agentId: string, name: string) => dispatch(actions.removeAgentSkill({ agentId, name }));
  const addAgentToolPattern = (agentId: string, pattern: string) => dispatch(actions.addAgentToolPattern({ agentId, pattern }));
  const removeAgentToolPattern = (agentId: string, pattern: string) => dispatch(actions.removeAgentToolPattern({ agentId, pattern }));

  // chat dispatcher
  const setEnableChat = (enabled: boolean) => dispatch(actions.setEnableChat({ enabled }));

  // deployment dispatchers
  const setProxyEnabled = (enabled: boolean) => dispatch(actions.setProxyEnabled({ enabled }));
  const setObservabilityEnabled = (enabled: boolean) => dispatch(actions.setObservabilityEnabled({ enabled }));
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
          <button className={tabClasses('spec')} onClick={() => setActiveTab('spec')}>CLI</button>
          <button className={tabClasses('agent')} onClick={() => setActiveTab('agent')}>Agent</button>
          <button className={tabClasses('powerhouse')} onClick={() => setActiveTab('powerhouse')}>Powerhouse</button>
          <button className={tabClasses('skills')} onClick={() => setActiveTab('skills')}>Skills</button>
          <button className={tabClasses('publish')} onClick={() => setActiveTab('publish')}>Publish</button>
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
            setMainAgentName={setMainAgentName}
            setMainAgentDescription={setMainAgentDescription}
            clearMainAgentDescription={clearMainAgentDescription}
            setMainAgentImage={setMainAgentImage}
            clearMainAgentImage={clearMainAgentImage}
            addSubAgent={addSubAgent}
            removeSubAgent={removeSubAgent}
            setSubAgentName={setSubAgentName}
            setSubAgentDescription={setSubAgentDescription}
            setAgentModel={setAgentModel}
            addAgentProfileRef={addAgentProfileRef}
            removeAgentProfileRef={removeAgentProfileRef}
            reorderAgentProfileRefs={reorderAgentProfileRefs}
            addAgentSkill={addAgentSkill}
            removeAgentSkill={removeAgentSkill}
            addAgentToolPattern={addAgentToolPattern}
            removeAgentToolPattern={removeAgentToolPattern}
            addModel={addModel}
            removeModel={removeModel}
            setDefaultModel={setDefaultModel}
            addProfile={addProfile}
            updateProfile={updateProfile}
            removeProfile={removeProfile}
            reorderProfiles={reorderProfiles}
            setEnableChat={setEnableChat}
          />
        )}

        {activeTab === 'powerhouse' && (
          <PowerhouseTab
            packages={state.packages}
            isAboveDisabled={isAboveDisabled}
            addPackage={addPackage}
            removePackage={removePackage}
            addDocType={addDocType}
            removeDocType={removeDocType}
          />
        )}

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
            setObservabilityEnabled={setObservabilityEnabled}
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
      <section className="my-6">
        <h3 className="text-lg font-semibold">Identity</h3>
        <div className="grid grid-cols-[3fr_1fr] gap-4">
          <TextField label="Package name" value={packageIdentifier} placeholder="@scope/my-tool-cli" onCommit={props.setPackageIdentifier} />
          <TextField label="Version" value={state.version} placeholder="0.1.0" onCommit={props.setVersion} />
        </div>
        <TextField label="Description" value={state.description} placeholder="What this CLI does" onCommit={props.setDescription} />
      </section>

      <hr />

      <section className="my-6">
        <h3 className="text-lg font-semibold">Features</h3>

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

interface AgentTabProps {
  mastra: PhClintMastraFeature;
  isAboveDisabled: boolean;
  setMainAgentName: (name: string) => void;
  setMainAgentDescription: (description: string) => void;
  clearMainAgentDescription: () => void;
  setMainAgentImage: (image: string) => void;
  clearMainAgentImage: () => void;
  addSubAgent: (id: string, name: string, description: string, modelId: string) => void;
  removeSubAgent: (id: string) => void;
  setSubAgentName: (id: string, name: string) => void;
  setSubAgentDescription: (id: string, description: string) => void;
  setAgentModel: (agentId: string, modelId: string) => void;
  addAgentProfileRef: (agentId: string, profileId: string, insertBefore?: string) => void;
  removeAgentProfileRef: (agentId: string, profileId: string) => void;
  reorderAgentProfileRefs: (agentId: string, ids: string[], insertBefore: string | null) => void;
  addAgentSkill: (agentId: string, name: string) => void;
  removeAgentSkill: (agentId: string, name: string) => void;
  addAgentToolPattern: (agentId: string, pattern: string) => void;
  removeAgentToolPattern: (agentId: string, pattern: string) => void;
  addModel: (id: string, isDefault?: boolean) => void;
  removeModel: (id: string) => void;
  setDefaultModel: (id: string) => void;
  addProfile: (id: string, title: string, content: string, insertBefore?: string) => void;
  updateProfile: (id: string, title?: string, content?: string) => void;
  removeProfile: (id: string) => void;
  reorderProfiles: (ids: string[], insertBefore: string | null) => void;
  setEnableChat: (enabled: boolean) => void;
}

function AgentTab(props: AgentTabProps) {
  const { mastra } = props;

  const main = mastra.mainAgent;
  if (!mastra.enabled || !main) {
    return (
      <section className="my-6 rounded border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        <h3 className="text-lg font-semibold">Agent</h3>
        <p className="mt-2">Enable Mastra in the Spec tab to configure agents.</p>
      </section>
    );
  }

  const allAgentIds = [main.id, ...mastra.subAgents.map((s) => s.id)];

  return (
    <>
      <MainAgentPanel
        main={main}
        models={mastra.models}
        profiles={mastra.profiles}
        setMainAgentName={props.setMainAgentName}
        setMainAgentDescription={props.setMainAgentDescription}
        clearMainAgentDescription={props.clearMainAgentDescription}
        setMainAgentImage={props.setMainAgentImage}
        clearMainAgentImage={props.clearMainAgentImage}
        setAgentModel={props.setAgentModel}
        addAgentProfileRef={props.addAgentProfileRef}
        removeAgentProfileRef={props.removeAgentProfileRef}
        reorderAgentProfileRefs={props.reorderAgentProfileRefs}
        addAgentSkill={props.addAgentSkill}
        removeAgentSkill={props.removeAgentSkill}
        addAgentToolPattern={props.addAgentToolPattern}
        removeAgentToolPattern={props.removeAgentToolPattern}
      />

      <hr />

      <SubAgentsSection
        subAgents={mastra.subAgents}
        models={mastra.models}
        profiles={mastra.profiles}
        existingAgentIds={allAgentIds}
        addSubAgent={props.addSubAgent}
        removeSubAgent={props.removeSubAgent}
        setSubAgentName={props.setSubAgentName}
        setSubAgentDescription={props.setSubAgentDescription}
        setAgentModel={props.setAgentModel}
        addAgentProfileRef={props.addAgentProfileRef}
        removeAgentProfileRef={props.removeAgentProfileRef}
        reorderAgentProfileRefs={props.reorderAgentProfileRefs}
        addAgentSkill={props.addAgentSkill}
        removeAgentSkill={props.removeAgentSkill}
        addAgentToolPattern={props.addAgentToolPattern}
        removeAgentToolPattern={props.removeAgentToolPattern}
      />

      <hr />

      <ModelsSection
        models={mastra.models}
        main={mastra.mainAgent}
        subAgents={mastra.subAgents}
        addModel={props.addModel}
        removeModel={props.removeModel}
        setDefaultModel={props.setDefaultModel}
      />

      <hr />

      <ProfilesSection
        profiles={mastra.profiles}
        main={mastra.mainAgent}
        subAgents={mastra.subAgents}
        addProfile={props.addProfile}
        updateProfile={props.updateProfile}
        removeProfile={props.removeProfile}
        reorderProfiles={props.reorderProfiles}
      />

      <hr />

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

/* ── Main Agent panel ─────────────────────────────────────────── */

interface MainAgentPanelProps {
  main: PhClintMainAgent;
  models: PhClintAgentModel[];
  profiles: PhClintAgentProfile[];
  setMainAgentName: (name: string) => void;
  setMainAgentDescription: (description: string) => void;
  clearMainAgentDescription: () => void;
  setMainAgentImage: (image: string) => void;
  clearMainAgentImage: () => void;
  setAgentModel: (agentId: string, modelId: string) => void;
  addAgentProfileRef: (agentId: string, profileId: string, insertBefore?: string) => void;
  removeAgentProfileRef: (agentId: string, profileId: string) => void;
  reorderAgentProfileRefs: (agentId: string, ids: string[], insertBefore: string | null) => void;
  addAgentSkill: (agentId: string, name: string) => void;
  removeAgentSkill: (agentId: string, name: string) => void;
  addAgentToolPattern: (agentId: string, pattern: string) => void;
  removeAgentToolPattern: (agentId: string, pattern: string) => void;
}

function MainAgentPanel(props: MainAgentPanelProps) {
  const { main } = props;

  return (
    <section className="my-6">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Main Agent</h3>
        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Main</span>
      </div>
      <p className="text-sm text-gray-600">The orchestrating agent. Subagents are exposed to it as tools named <code>agent-&lt;subagent-id&gt;</code>. Only the main agent can have an avatar.</p>

      <div className="my-3 rounded border border-gray-200 bg-white p-4">
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ flexShrink: 0, width: '7rem' }}>
            <AgentImageField image={main.image ?? null} onSetImage={props.setMainAgentImage} onClearImage={props.clearMainAgentImage} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="grid grid-cols-[1fr_2fr] gap-4">
              <TextField compact readOnly label="Agent ID" value={main.id} onCommit={() => {}} />
              <TextField compact label="Agent Name" value={main.name} placeholder="My Agent" onCommit={props.setMainAgentName} />
            </div>
            <DescriptionField
              value={main.description}
              placeholder="A brief description of what this agent does"
              onSet={props.setMainAgentDescription}
              onClear={props.clearMainAgentDescription}
            />
          </div>
        </div>

        <hr className="my-4" />

        <AgentBindings
          agentId={main.id}
          isMain
          modelId={main.modelId}
          profileIds={main.profileIds}
          skills={main.skills}
          toolPatterns={main.toolPatterns}
          models={props.models}
          profiles={props.profiles}
          setAgentModel={props.setAgentModel}
          addAgentProfileRef={props.addAgentProfileRef}
          removeAgentProfileRef={props.removeAgentProfileRef}
          reorderAgentProfileRefs={props.reorderAgentProfileRefs}
          addAgentSkill={props.addAgentSkill}
          removeAgentSkill={props.removeAgentSkill}
          addAgentToolPattern={props.addAgentToolPattern}
          removeAgentToolPattern={props.removeAgentToolPattern}
        />
      </div>
    </section>
  );
}

function DescriptionField(props: { value: string | null | undefined; placeholder: string; onSet: (v: string) => void; onClear: () => void }) {
  return (
    <label className="my-1 block">
      <h3 className="text-xs text-gray-600">Description</h3>
      <div className="flex items-center gap-2">
        <input
          type="text"
          defaultValue={props.value ?? ''}
          placeholder={props.placeholder}
          onBlur={(e) => {
            const next = e.target.value.trim();
            if (next && next !== (props.value ?? '')) props.onSet(next);
            else if (!next && props.value !== null) props.onClear();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className="w-full font-mono"
        />
      </div>
    </label>
  );
}

/* ── Sub agents ──────────────────────────────────────────────── */

interface SubAgentsSectionProps {
  subAgents: PhClintSubAgent[];
  models: PhClintAgentModel[];
  profiles: PhClintAgentProfile[];
  existingAgentIds: string[];
  addSubAgent: (id: string, name: string, description: string, modelId: string) => void;
  removeSubAgent: (id: string) => void;
  setSubAgentName: (id: string, name: string) => void;
  setSubAgentDescription: (id: string, description: string) => void;
  setAgentModel: (agentId: string, modelId: string) => void;
  addAgentProfileRef: (agentId: string, profileId: string, insertBefore?: string) => void;
  removeAgentProfileRef: (agentId: string, profileId: string) => void;
  reorderAgentProfileRefs: (agentId: string, ids: string[], insertBefore: string | null) => void;
  addAgentSkill: (agentId: string, name: string) => void;
  removeAgentSkill: (agentId: string, name: string) => void;
  addAgentToolPattern: (agentId: string, pattern: string) => void;
  removeAgentToolPattern: (agentId: string, pattern: string) => void;
}

function SubAgentsSection(props: SubAgentsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold">Sub-agents</h3>
      <p className="text-sm text-gray-600">Specialised agents the main agent can delegate to. Each is exposed as a tool named <code>agent-&lt;id&gt;</code>.</p>

      {props.subAgents.map((sub) => (
        <SubAgentCard
          key={sub.id}
          sub={sub}
          models={props.models}
          profiles={props.profiles}
          removeSubAgent={props.removeSubAgent}
          setSubAgentName={props.setSubAgentName}
          setSubAgentDescription={props.setSubAgentDescription}
          setAgentModel={props.setAgentModel}
          addAgentProfileRef={props.addAgentProfileRef}
          removeAgentProfileRef={props.removeAgentProfileRef}
          reorderAgentProfileRefs={props.reorderAgentProfileRefs}
          addAgentSkill={props.addAgentSkill}
          removeAgentSkill={props.removeAgentSkill}
          addAgentToolPattern={props.addAgentToolPattern}
          removeAgentToolPattern={props.removeAgentToolPattern}
        />
      ))}

      {showAddForm ? (
        <AddSubAgentForm
          models={props.models}
          existingAgentIds={props.existingAgentIds}
          onAdd={(id, name, description, modelId) => {
            props.addSubAgent(id, name, description, modelId);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          className="mt-3 rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={props.models.length === 0}
          title={props.models.length === 0 ? 'Add a model first' : ''}
          onClick={() => setShowAddForm(true)}
        >
          + Add Sub-agent
        </button>
      )}
    </section>
  );
}

function AddSubAgentForm(props: {
  models: PhClintAgentModel[];
  existingAgentIds: string[];
  onAdd: (id: string, name: string, description: string, modelId: string) => void;
  onCancel: () => void;
}) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const defaultModel = props.models.find((m) => m.isDefault) ?? props.models[0];
  const [modelId, setModelId] = useState<string>(defaultModel?.id ?? '');

  const idValid = /^[a-z][a-z0-9-]*$/.test(id) && !props.existingAgentIds.includes(id);
  const canAdd = idValid && name.trim() && description.trim() && modelId;

  return (
    <div className="my-3 rounded border border-blue-200 bg-blue-50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-600">Sub-agent ID</span>
          <input
            type="text"
            value={id}
            placeholder="summarizer"
            onChange={(e) => setId(e.target.value.trim())}
            className="w-full rounded border p-2 font-mono text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-gray-600">Display name</span>
          <input
            type="text"
            value={name}
            placeholder="Summarizer"
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border p-2 text-sm"
          />
        </label>
      </div>
      <label className="my-2 block">
        <span className="text-xs text-gray-600">Description (the main agent uses this to decide when to delegate)</span>
        <input
          type="text"
          value={description}
          placeholder="Summarizes long documents into bullet points"
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border p-2 text-sm"
        />
      </label>
      <label className="my-2 block">
        <span className="text-xs text-gray-600">Model</span>
        <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="w-full rounded border p-2 font-mono text-sm">
          {props.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
              {m.isDefault ? ' (default)' : ''}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canAdd}
          onClick={() => props.onAdd(id, name.trim(), description.trim(), modelId)}
        >
          Add
        </button>
        <button className="text-sm text-gray-500 hover:text-gray-700" onClick={props.onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface SubAgentCardProps {
  sub: PhClintSubAgent;
  models: PhClintAgentModel[];
  profiles: PhClintAgentProfile[];
  removeSubAgent: (id: string) => void;
  setSubAgentName: (id: string, name: string) => void;
  setSubAgentDescription: (id: string, description: string) => void;
  setAgentModel: (agentId: string, modelId: string) => void;
  addAgentProfileRef: (agentId: string, profileId: string, insertBefore?: string) => void;
  removeAgentProfileRef: (agentId: string, profileId: string) => void;
  reorderAgentProfileRefs: (agentId: string, ids: string[], insertBefore: string | null) => void;
  addAgentSkill: (agentId: string, name: string) => void;
  removeAgentSkill: (agentId: string, name: string) => void;
  addAgentToolPattern: (agentId: string, pattern: string) => void;
  removeAgentToolPattern: (agentId: string, pattern: string) => void;
}

function SubAgentCard(props: SubAgentCardProps) {
  const { sub } = props;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-3 rounded border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="text-sm text-gray-400 hover:text-gray-700" onClick={() => setExpanded(!expanded)} title={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? '▾' : '▸'}
          </button>
          <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">{sub.id}</span>
          <span className="font-semibold">{sub.name}</span>
        </div>
        <button className="text-sm text-red-500 hover:text-red-700" onClick={() => props.removeSubAgent(sub.id)}>
          Remove
        </button>
      </div>
      <p className="ml-7 text-sm text-gray-600">{sub.description}</p>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField compact label="Name" value={sub.name} onCommit={(v) => props.setSubAgentName(sub.id, v)} />
            <TextField compact label="Description" value={sub.description} onCommit={(v) => props.setSubAgentDescription(sub.id, v)} />
          </div>
          <AgentBindings
            agentId={sub.id}
            isMain={false}
            modelId={sub.modelId}
            profileIds={sub.profileIds}
            skills={sub.skills}
            toolPatterns={sub.toolPatterns}
            models={props.models}
            profiles={props.profiles}
            setAgentModel={props.setAgentModel}
            addAgentProfileRef={props.addAgentProfileRef}
            removeAgentProfileRef={props.removeAgentProfileRef}
            reorderAgentProfileRefs={props.reorderAgentProfileRefs}
            addAgentSkill={props.addAgentSkill}
            removeAgentSkill={props.removeAgentSkill}
            addAgentToolPattern={props.addAgentToolPattern}
            removeAgentToolPattern={props.removeAgentToolPattern}
          />
        </div>
      )}
    </div>
  );
}

/* ── Agent bindings (per-agent model + profiles + skills + tool patterns) ── */

interface AgentBindingsProps {
  agentId: string;
  isMain: boolean;
  modelId: string;
  profileIds: string[];
  skills: string[];
  toolPatterns: string[];
  models: PhClintAgentModel[];
  profiles: PhClintAgentProfile[];
  setAgentModel: (agentId: string, modelId: string) => void;
  addAgentProfileRef: (agentId: string, profileId: string, insertBefore?: string) => void;
  removeAgentProfileRef: (agentId: string, profileId: string) => void;
  reorderAgentProfileRefs: (agentId: string, ids: string[], insertBefore: string | null) => void;
  addAgentSkill: (agentId: string, name: string) => void;
  removeAgentSkill: (agentId: string, name: string) => void;
  addAgentToolPattern: (agentId: string, pattern: string) => void;
  removeAgentToolPattern: (agentId: string, pattern: string) => void;
}

function AgentBindings(props: AgentBindingsProps) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs text-gray-600">Model</span>
        <select
          value={props.modelId}
          onChange={(e) => props.setAgentModel(props.agentId, e.target.value)}
          className="mt-1 w-full rounded border p-2 font-mono text-sm"
        >
          {props.models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
              {m.isDefault ? ' (default)' : ''}
            </option>
          ))}
        </select>
      </label>

      <ProfileRefsEditor
        agentId={props.agentId}
        profileIds={props.profileIds}
        allProfiles={props.profiles}
        onAdd={(profileId) => props.addAgentProfileRef(props.agentId, profileId)}
        onRemove={(profileId) => props.removeAgentProfileRef(props.agentId, profileId)}
        onReorder={(ids, insertBefore) => props.reorderAgentProfileRefs(props.agentId, ids, insertBefore)}
      />

      <ChipListEditor
        label="Skills"
        hint="Reference skills by name. tpl wins over ext if both exist."
        values={props.skills}
        placeholder="skill-name"
        validator={(v) => /^[a-z][a-z0-9-]*$/.test(v)}
        onAdd={(v) => props.addAgentSkill(props.agentId, v)}
        onRemove={(v) => props.removeAgentSkill(props.agentId, v)}
      />

      <ChipListEditor
        label="Tool patterns"
        hint={
          props.isMain
            ? 'Glob patterns over tool names (e.g. clint-project-*, *-mcp__*). Empty = all tools.'
            : 'Glob patterns over tool names. Empty = no tools.'
        }
        values={props.toolPatterns}
        placeholder="pattern*"
        validator={(v) => v.length > 0}
        onAdd={(v) => props.addAgentToolPattern(props.agentId, v)}
        onRemove={(v) => props.removeAgentToolPattern(props.agentId, v)}
      />
    </div>
  );
}

function ProfileRefsEditor(props: {
  agentId: string;
  profileIds: string[];
  allProfiles: PhClintAgentProfile[];
  onAdd: (profileId: string) => void;
  onRemove: (profileId: string) => void;
  onReorder: (ids: string[], insertBefore: string | null) => void;
}) {
  const available = props.allProfiles.filter((p) => !props.profileIds.includes(p.id));

  const moveUp = (index: number) => {
    if (index === 0) return;
    const id = props.profileIds[index];
    const beforeId = props.profileIds[index - 1];
    props.onReorder([id], beforeId);
  };

  const moveDown = (index: number) => {
    if (index >= props.profileIds.length - 1) return;
    const id = props.profileIds[index];
    const afterNext = index + 2 < props.profileIds.length ? props.profileIds[index + 2] : null;
    props.onReorder([id], afterNext);
  };

  return (
    <div>
      <span className="text-xs text-gray-600">Profiles (instructions, in order)</span>
      <ul className="my-1 space-y-1">
        {props.profileIds.map((profileId, i) => {
          const profile = props.allProfiles.find((p) => p.id === profileId);
          return (
            <li key={profileId} className="flex items-center gap-2 rounded bg-gray-50 px-2 py-1">
              <button className="text-gray-400 hover:text-gray-600 disabled:opacity-30" disabled={i === 0} onClick={() => moveUp(i)} title="Move up">
                ↑
              </button>
              <button className="text-gray-400 hover:text-gray-600 disabled:opacity-30" disabled={i === props.profileIds.length - 1} onClick={() => moveDown(i)} title="Move down">
                ↓
              </button>
              <span className="font-mono text-xs text-gray-500">{profileId}</span>
              <span className="flex-1 text-sm">{profile?.title ?? <em className="text-red-500">(missing in library)</em>}</span>
              <button className="text-sm text-red-500 hover:text-red-700" onClick={() => props.onRemove(profileId)}>
                Remove
              </button>
            </li>
          );
        })}
        {props.profileIds.length === 0 && (
          <li className="px-2 py-1 text-sm italic text-gray-400">No profiles assigned</li>
        )}
      </ul>
      {available.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) props.onAdd(e.target.value);
          }}
          className="rounded border p-1 text-sm"
        >
          <option value="">+ Add profile…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.id})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function ChipListEditor(props: {
  label: string;
  hint: string;
  values: string[];
  placeholder: string;
  validator: (v: string) => boolean;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [input, setInput] = useState('');
  const valid = props.validator(input.trim());

  return (
    <div>
      <span className="text-xs text-gray-600">{props.label}</span>
      <p className="text-xs text-gray-500">{props.hint}</p>
      <div className="my-1 flex flex-wrap items-center gap-1">
        {props.values.map((v) => (
          <span key={v} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs">
            {v}
            <button className="text-red-500 hover:text-red-700" onClick={() => props.onRemove(v)} title="Remove">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={props.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valid) {
              props.onAdd(input.trim());
              setInput('');
            }
          }}
          className="flex-1 rounded border p-1 font-mono text-sm"
        />
        <button
          className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!valid}
          onClick={() => {
            props.onAdd(input.trim());
            setInput('');
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* ── Agent image (avatar) — main only ────────────────────────── */

function AgentImageField(props: { image: string | null | undefined; onSetImage: (dataUrl: string) => void; onClearImage: () => void }) {
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

/* ── Models library ──────────────────────────────────────────── */

function ModelsSection(props: {
  models: PhClintAgentModel[];
  main: PhClintMainAgent | null | undefined;
  subAgents: PhClintSubAgent[];
  addModel: (id: string, isDefault?: boolean) => void;
  removeModel: (id: string) => void;
  setDefaultModel: (id: string) => void;
}) {
  const [newModelId, setNewModelId] = useState('');

  const usersOf = (modelId: string): string[] => {
    const u: string[] = [];
    if (props.main?.modelId === modelId) u.push(props.main.id);
    for (const s of props.subAgents) if (s.modelId === modelId) u.push(s.id);
    return u;
  };

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
      <p className="text-sm text-gray-600">Provider/model format (e.g. anthropic/claude-sonnet-4-5). Exactly one is the default.</p>

      {props.models.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-1">Default</th>
              <th className="py-1">Model</th>
              <th className="py-1">Used by</th>
              <th className="py-1" />
            </tr>
          </thead>
          <tbody>
            {props.models.map((m) => {
              const users = usersOf(m.id);
              const inUse = users.length > 0;
              return (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="py-2">
                    <input type="radio" name="default-model" checked={m.isDefault} onChange={() => props.setDefaultModel(m.id)} />
                  </td>
                  <td className="py-2 font-mono">{m.id}</td>
                  <td className="py-2 text-xs text-gray-500">{users.length === 0 ? <em>—</em> : users.join(', ')}</td>
                  <td className="py-2 text-right">
                    <button
                      className="text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300"
                      disabled={inUse}
                      title={inUse ? `In use by ${users.join(', ')}` : ''}
                      onClick={() => props.removeModel(m.id)}
                    >
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

/* ── Profiles library ────────────────────────────────────────── */

function ProfilesSection(props: {
  profiles: PhClintAgentProfile[];
  main: PhClintMainAgent | null | undefined;
  subAgents: PhClintSubAgent[];
  addProfile: (id: string, title: string, content: string, insertBefore?: string) => void;
  updateProfile: (id: string, title?: string, content?: string) => void;
  removeProfile: (id: string) => void;
  reorderProfiles: (ids: string[], insertBefore: string | null) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const usersOf = (profileId: string): string[] => {
    const u: string[] = [];
    if (props.main?.profileIds.includes(profileId)) u.push(props.main.id);
    for (const s of props.subAgents) if (s.profileIds.includes(profileId)) u.push(s.id);
    return u;
  };

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
      <p className="text-sm text-gray-600">Markdown sections that compose into agents&apos; instructions. Reference these from each agent&apos;s profile list.</p>

      {props.profiles.map((profile, i) => {
        const users = usersOf(profile.id);
        const inUse = users.length > 0;
        return (
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
                {users.length > 0 && (
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700" title={users.join(', ')}>
                    used by: {users.join(', ')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button className="px-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" disabled={i === 0} onClick={() => moveUp(i)} title="Move up">
                  ↑
                </button>
                <button className="px-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" disabled={i === props.profiles.length - 1} onClick={() => moveDown(i)} title="Move down">
                  ↓
                </button>
                <button
                  className="ml-2 text-sm text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-300"
                  disabled={inUse}
                  title={inUse ? `In use by ${users.join(', ')}` : ''}
                  onClick={() => props.removeProfile(profile.id)}
                >
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
        );
      })}

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
      <section className="my-6 rounded border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
        <h3 className="text-lg font-semibold">Skill Templates</h3>
        <p className="mt-2">Coming soon</p>
      </section>

      <hr />

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
  setObservabilityEnabled: (enabled: boolean) => void;
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

      <DeploymentSection
        deployment={props.deployment}
        setProxyEnabled={props.setProxyEnabled}
        setObservabilityEnabled={props.setObservabilityEnabled}
        addSupportedResource={props.addSupportedResource}
        removeSupportedResource={props.removeSupportedResource}
      />

      <hr />

      <section className="my-6">
        <h3 className="text-lg font-semibold">Document</h3>
        <div className="my-3 rounded border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Document ID: <span className="font-mono">{props.documentHeader.id}</span></p>
          <p className="text-sm text-gray-600">Type: <span className="font-mono">{props.documentHeader.documentType}</span></p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Bump version to:</span>
            <input
              type="text"
              placeholder="0.2.0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = e.currentTarget.value.trim();
                  if (v) props.bumpVersion(v);
                  e.currentTarget.value = '';
                }
              }}
              className="rounded border p-1 font-mono text-sm"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function DeploymentSection(props: {
  deployment: PhClintDeployment;
  setProxyEnabled: (enabled: boolean) => void;
  setObservabilityEnabled: (enabled: boolean) => void;
  addSupportedResource: (resource: string) => void;
  removeSupportedResource: (resource: string) => void;
}) {
  const [newResource, setNewResource] = useState('');

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold">Deployment</h3>

      <div className="my-3 rounded border border-gray-200 bg-white p-4">
        <Toggle label="Proxy enabled" checked={props.deployment.proxyEnabled} onChange={props.setProxyEnabled} hint="Embedded reverse proxy" />
        <Toggle label="Observability enabled" checked={props.deployment.observabilityEnabled} onChange={props.setObservabilityEnabled} hint="Sentry + OpenTelemetry" />
      </div>

      <div className="my-3 rounded border border-gray-200 bg-white p-4">
        <h4 className="text-base font-semibold">Supported resources</h4>
        <ul className="my-2 space-y-1">
          {props.deployment.supportedResources.map((r) => (
            <li key={r} className="flex items-center justify-between text-sm">
              <span className="font-mono">{r}</span>
              <button className="text-red-500 hover:text-red-700" onClick={() => props.removeSupportedResource(r)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="vetra-agent-..."
            value={newResource}
            onChange={(e) => setNewResource(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newResource.trim()) {
                props.addSupportedResource(newResource.trim());
                setNewResource('');
              }
            }}
            className="flex-1 rounded border p-1 font-mono text-sm"
          />
          <button
            className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={!newResource.trim()}
            onClick={() => {
              props.addSupportedResource(newResource.trim());
              setNewResource('');
            }}
          >
            Add
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Powerhouse Packages section ─────────────────────────────── */

function PackagesSection(props: {
  packages: PowerhousePackage[];
  addPackage: (packageName: string) => void;
  removePackage: (id: string) => void;
  addDocType: (packageId: string, documentType: string) => void;
  removeDocType: (packageId: string, documentType: string) => void;
}) {
  const [newPackage, setNewPackage] = useState('');

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold">Reactor Packages</h3>

      {props.packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} addDocType={props.addDocType} removeDocType={props.removeDocType} removePackage={props.removePackage} />
      ))}

      <div className="my-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="@scope/package-name"
          value={newPackage}
          onChange={(e) => setNewPackage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newPackage.trim()) {
              props.addPackage(newPackage.trim());
              setNewPackage('');
            }
          }}
          className="flex-1 rounded border p-2 font-mono text-sm"
        />
        <button
          className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={!newPackage.trim()}
          onClick={() => {
            props.addPackage(newPackage.trim());
            setNewPackage('');
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

  return (
    <div className="my-3 rounded border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono font-semibold">{props.pkg.packageName}</span>
          {props.pkg.managed && <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">managed</span>}
          {props.pkg.version && <span className="ml-2 text-sm text-gray-500">v{props.pkg.version}</span>}
        </div>
        {!props.pkg.managed && (
          <button className="text-sm text-red-500 hover:text-red-700" onClick={() => props.removePackage(props.pkg.id)}>
            Remove Package
          </button>
        )}
      </div>
      <ul className="my-2 space-y-1">
        {props.pkg.documentTypes.map((dt) => (
          <li key={dt} className="flex items-center justify-between text-sm">
            <span className="font-mono">{dt}</span>
            <button className="text-red-500 hover:text-red-700" onClick={() => props.removeDocType(props.pkg.id, dt)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          placeholder="org/doc-type or */*"
          value={newDocType}
          onChange={(e) => setNewDocType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newDocType.trim()) {
              props.addDocType(props.pkg.id, newDocType.trim());
              setNewDocType('');
            }
          }}
          className="flex-1 rounded border p-1 font-mono text-sm"
        />
        <button
          className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={!newDocType.trim()}
          onClick={() => {
            props.addDocType(props.pkg.id, newDocType.trim());
            setNewDocType('');
          }}
        >
          Add Doc Type
        </button>
      </div>
    </div>
  );
}

function StatusBadge(props: { status: string }) {
  const color = props.status === 'Succeeded' ? 'bg-green-100 text-green-700'
    : props.status === 'Failed' ? 'bg-red-100 text-red-700'
    : props.status === 'InProgress' ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-100 text-gray-700';
  return <span className={`rounded px-2 py-0.5 text-xs ${color}`}>{props.status}</span>;
}
