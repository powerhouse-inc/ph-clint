import { useState } from 'react';
import { generateId } from 'document-model';
import { DocumentToolbar } from '@powerhousedao/design-system/connect';
import { useSelectedPhClintProjectDocument, actions } from 'document-models/ph-clint-project';
import type { PowerhouseLevel, PowerhousePackage, ExternalSkill, PublishRecord, PhClintProjectState } from '../../document-models/ph-clint-project/v1/gen/types.js';

const POWERHOUSE_LEVELS: PowerhouseLevel[] = ['Disabled', 'Reactor', 'Switchboard', 'Connect'];

function TextField(props: { label: string; value: string; placeholder?: string; readOnly?: boolean; onCommit: (value: string) => void }) {
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

type Tab = 'spec' | 'agent-profiles' | 'skill-templates';

export default function Editor() {
  const [document, dispatch] = useSelectedPhClintProjectDocument();
  const state = document.state.global;
  const { powerhouse, mastra, routine } = state.features;
  const [activeTab, setActiveTab] = useState<Tab>('spec');

  // identity dispatchers
  const setPackageName = (name: string) => dispatch(actions.setPackageName({ name }));
  const setScope = (scope: string) => {
    if (scope === '') dispatch(actions.clearScope({ _: true }));
    else dispatch(actions.setScope({ scope }));
  };
  const setVersion = (version: string) => dispatch(actions.setVersion({ version }));
  const setDescription = (description: string) => dispatch(actions.setDescription({ description }));
  const setBin = (bin: string) => {
    if (bin === '') dispatch(actions.clearBin({ _: true }));
    else dispatch(actions.setBin({ bin }));
  };

  // feature dispatchers
  const setPowerhouseLevel = (level: PowerhouseLevel) => dispatch(actions.setPowerhouseLevel({ level }));
  const toggleMastra = (enabled: boolean) => {
    if (enabled) dispatch(actions.enableMastra({ _: true }));
    else dispatch(actions.disableMastra({ _: true }));
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
  const publishDev = () =>
    dispatch(
      actions.publishDev({
        id: generateId(),
        timestamp: new Date().toISOString(),
      }),
    );
  const publishStaging = () =>
    dispatch(
      actions.publishStaging({
        id: generateId(),
        timestamp: new Date().toISOString(),
      }),
    );
  const publishProduction = () =>
    dispatch(
      actions.publishProduction({
        id: generateId(),
        timestamp: new Date().toISOString(),
      }),
    );

  const isAboveDisabled = powerhouse !== 'Disabled';

  const tabClasses = (tab: Tab) => `px-4 py-2 text-sm font-medium border-b-2 cursor-pointer ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="mx-auto max-w-4xl bg-gray-50 p-6">
      <DocumentToolbar />

      <div className="ph-default-styles">
        <h2 className="mt-4 text-xl font-bold">ph-clint Project Spec</h2>

        {/* Tabs */}
        <nav className="my-4 flex border-b border-gray-200">
          <button className={tabClasses('spec')} onClick={() => setActiveTab('spec')}>
            Project Spec
          </button>
          <button className={tabClasses('agent-profiles')} onClick={() => setActiveTab('agent-profiles')}>
            Agent Profiles
          </button>
          <button className={tabClasses('skill-templates')} onClick={() => setActiveTab('skill-templates')}>
            Skill Templates
          </button>
        </nav>

        {activeTab === 'spec' && (
          <SpecTab
            state={state}
            powerhouse={powerhouse}
            mastra={mastra}
            routine={routine}
            isAboveDisabled={isAboveDisabled}
            documentHeader={document.header}
            setPackageName={setPackageName}
            setScope={setScope}
            setVersion={setVersion}
            setDescription={setDescription}
            setBin={setBin}
            setPowerhouseLevel={setPowerhouseLevel}
            toggleMastra={toggleMastra}
            toggleRoutine={toggleRoutine}
            addPackage={addPackage}
            removePackage={removePackage}
            addDocType={addDocType}
            removeDocType={removeDocType}
            addSkill={addSkill}
            removeSkill={removeSkill}
            bumpVersion={bumpVersion}
            publishDev={publishDev}
            publishStaging={publishStaging}
            publishProduction={publishProduction}
          />
        )}

        {activeTab === 'agent-profiles' && <PlaceholderTab title="Agent Profiles" />}
        {activeTab === 'skill-templates' && <PlaceholderTab title="Skill Templates" />}
      </div>
    </div>
  );
}

function PlaceholderTab(props: { title: string }) {
  return (
    <section className="my-6 rounded border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
      <h3 className="text-lg font-semibold">{props.title}</h3>
      <p className="mt-2">Coming soon</p>
    </section>
  );
}

function SpecTab(props: {
  state: PhClintProjectState;
  powerhouse: PowerhouseLevel;
  mastra: { enabled: boolean };
  routine: { enabled: boolean };
  isAboveDisabled: boolean;
  documentHeader: { id: string; documentType: string };
  setPackageName: (name: string) => void;
  setScope: (scope: string) => void;
  setVersion: (version: string) => void;
  setDescription: (description: string) => void;
  setBin: (bin: string) => void;
  setPowerhouseLevel: (level: PowerhouseLevel) => void;
  toggleMastra: (enabled: boolean) => void;
  toggleRoutine: (enabled: boolean) => void;
  addPackage: (packageName: string) => void;
  removePackage: (id: string) => void;
  addDocType: (packageId: string, documentType: string) => void;
  removeDocType: (packageId: string, documentType: string) => void;
  addSkill: (name: string, githubUrl: string) => void;
  removeSkill: (id: string) => void;
  bumpVersion: (version: string) => void;
  publishDev: () => void;
  publishStaging: () => void;
  publishProduction: () => void;
}) {
  const { state } = props;

  return (
    <>
      {/* Identity */}
      <section className="my-6">
        <h3 className="text-lg font-semibold">Identity</h3>
        <TextField label="Package name" value={state.name ?? ''} placeholder="my-clint-cli" onCommit={props.setPackageName} />
        <TextField label="Scope (optional)" value={state.scope ?? ''} placeholder="e.g. my-org (leave empty for unscoped)" onCommit={props.setScope} />
        <TextField label="Version" value={state.version} placeholder="0.1.0" onCommit={props.setVersion} />
        <TextField label="Description" value={state.description} placeholder="What this CLI does" onCommit={props.setDescription} />
        <TextField label="Bin name (optional)" value={state.bin ?? ''} placeholder="defaults to package name" onCommit={props.setBin} />
      </section>

      <hr />

      {/* Features */}
      <section className="my-6">
        <h3 className="text-lg font-semibold">Features</h3>

        <div className="my-4 rounded border border-gray-200 bg-white p-4">
          <label className="my-2 block">
            <h3 className="text-base font-semibold">Powerhouse</h3>
            <span className="text-sm text-gray-600">{props.isAboveDisabled ? 'Cannot go back to Disabled once enabled (irreversible migration)' : 'Ordered levels: Disabled < Reactor < Switchboard < Connect'}</span>
            <select className="mt-2 block w-full rounded border p-2" value={props.powerhouse} onChange={(e) => props.setPowerhouseLevel(e.target.value as PowerhouseLevel)}>
              {POWERHOUSE_LEVELS.map((level) => (
                <option key={level} value={level} disabled={props.isAboveDisabled && level === 'Disabled'}>
                  {level}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="my-4 rounded border border-gray-200 bg-white p-4">
          <Toggle label="Mastra" checked={props.mastra.enabled} hint="AI agent framework" onChange={props.toggleMastra} />
        </div>

        <div className="my-4 rounded border border-gray-200 bg-white p-4">
          <Toggle label="Routine loop" checked={props.routine.enabled} hint="tick-based execution loop with triggers" onChange={props.toggleRoutine} />
        </div>
      </section>

      {/* Packages — only visible when Powerhouse >= Reactor */}
      {props.isAboveDisabled && (
        <>
          <hr />
          <PackagesSection packages={state.packages} addPackage={props.addPackage} removePackage={props.removePackage} addDocType={props.addDocType} removeDocType={props.removeDocType} appPackageName={state.name ? `${state.name}-app` : null} />
        </>
      )}

      <hr />

      {/* External Skills */}
      <SkillsSection skills={state.externalSkills} addSkill={props.addSkill} removeSkill={props.removeSkill} />

      <hr />

      {/* Publishing */}
      <PublishSection version={state.version} publishHistory={state.publishHistory} bumpVersion={props.bumpVersion} publishDev={props.publishDev} publishStaging={props.publishStaging} publishProduction={props.publishProduction} />

      <hr />

      {/* Document header info */}
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

function PackagesSection(props: {
  packages: PowerhousePackage[];
  addPackage: (packageName: string) => void;
  removePackage: (id: string) => void;
  addDocType: (packageId: string, documentType: string) => void;
  removeDocType: (packageId: string, documentType: string) => void;
  appPackageName: string | null;
}) {
  const [newPkgName, setNewPkgName] = useState('');

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold">Powerhouse Packages</h3>
      <p className="text-sm text-gray-600">Reactor packages and their document types. The app package is auto-managed.</p>

      {props.packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} isAppPackage={pkg.packageName === props.appPackageName} addDocType={props.addDocType} removeDocType={props.removeDocType} removePackage={props.removePackage} />
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

function PackageCard(props: { pkg: PowerhousePackage; isAppPackage: boolean; addDocType: (packageId: string, documentType: string) => void; removeDocType: (packageId: string, documentType: string) => void; removePackage: (id: string) => void }) {
  const [newDocType, setNewDocType] = useState('');
  const { pkg } = props;

  return (
    <div className="my-3 rounded border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono font-semibold">{pkg.packageName}</span>
          {props.isAppPackage && <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">app</span>}
        </div>
        {!props.isAppPackage && (
          <button className="text-sm text-red-500 hover:text-red-700" onClick={() => props.removePackage(pkg.id)}>
            Remove
          </button>
        )}
      </div>

      {pkg.documentTypes.length > 0 && (
        <ul className="mt-2 space-y-1">
          {pkg.documentTypes.map((dt) => (
            <li key={dt} className="flex items-center gap-2 text-sm">
              <span className="font-mono">{dt}</span>
              <button className="text-xs text-red-400 hover:text-red-600" onClick={() => props.removeDocType(pkg.id, dt)}>
                x
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-center gap-2">
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
      </div>
    </div>
  );
}

function SkillsSection(props: { skills: ExternalSkill[]; addSkill: (name: string, githubUrl: string) => void; removeSkill: (id: string) => void }) {
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

function PublishSection(props: { version: string; publishHistory: PublishRecord[]; bumpVersion: (version: string) => void; publishDev: () => void; publishStaging: () => void; publishProduction: () => void }) {
  const recentHistory = props.publishHistory.slice(-5).reverse();

  return (
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
