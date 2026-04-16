import type { DocumentModelGlobalState } from "document-model";

export const documentModel: DocumentModelGlobalState = {
  id: "powerhouse/ph-clint-project",
  name: "PhClintProject",
  author: {
    name: "Powerhouse Inc.",
    website: "https://powerhouse.inc",
  },
  extension: "pcp",
  description:
    "A ph-clint implementation project specification. Drives code generation of a ph-clint CLI project: identity fields (name, scope, version, description, bin) plus three feature toggles (Powerhouse, Mastra, Routine). Enabling Powerhouse is irreversible; enabling Mastra auto-enables Routine; disabling Routine is blocked while Mastra is on.",
  specifications: [
    {
      state: {
        local: {
          schema: "",
          examples: [],
          initialValue: "",
        },
        global: {
          schema:
            "type PhClintProjectState {\n  name: String\n  scope: String\n  version: String!\n  description: String!\n  bin: String\n  features: PhClintFeatures!\n}\n\ntype PhClintFeatures {\n  powerhouse: PhClintPowerhouseFeature!\n  mastra: PhClintMastraFeature!\n  routine: PhClintRoutineFeature!\n}\n\ntype PhClintPowerhouseFeature {\n  enabled: Boolean!\n  switchboard: Boolean!\n  connect: Boolean!\n}\n\ntype PhClintMastraFeature {\n  enabled: Boolean!\n}\n\ntype PhClintRoutineFeature {\n  enabled: Boolean!\n}\n",
          examples: [],
          initialValue:
            '{\n  "name": null,\n  "scope": null,\n  "version": "0.1.0",\n  "description": "",\n  "bin": null,\n  "features": {\n    "powerhouse": { "enabled": false, "switchboard": true, "connect": true },\n    "mastra": { "enabled": false },\n    "routine": { "enabled": false }\n  }\n}',
        },
      },
      modules: [
        {
          id: "m-identity",
          name: "identity",
          description:
            "Package identity fields: name, scope, version, description, bin",
          operations: [
            {
              id: "o-set-package-name",
              name: "SET_PACKAGE_NAME",
              description:
                "Set the bare package name (no scope). Must match /^[a-z][a-z0-9-]*$/.",
              schema: "input SetPackageNameInput {\n  name: String!\n}",
              template:
                "Set the bare package name (no scope). Must match /^[a-z][a-z0-9-]*$/.",
              reducer:
                "if (!/^[a-z][a-z0-9-]*$/.test(action.input.name)) {\n  throw new InvalidNameError(`Invalid package name: ${action.input.name}`);\n}\nstate.name = action.input.name;",
              errors: [
                {
                  id: "e-set-package-name-invalid",
                  name: "InvalidNameError",
                  code: "INVALID_NAME",
                  description:
                    "The package name must match /^[a-z][a-z0-9-]*$/ \u2014 lowercase letter followed by lowercase letters, digits, and hyphens.",
                  template: "Invalid package name: {{name}}",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "o-clear-bin",
              name: "CLEAR_BIN",
              description:
                "Clear the bin override. The generator will fall back to the package name.",
              schema: "input ClearBinInput {\n  _: Boolean\n}",
              template:
                "Clear the bin override. The generator will fall back to the package name.",
              reducer: "state.bin = null;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "o-set-bin",
              name: "SET_BIN",
              description:
                "Set the bin name (CLI binary). Defaults to package name when not set. Must match /^[a-z][a-z0-9-]*$/.",
              schema: "input SetBinInput {\n  bin: String!\n}",
              template:
                "Set the bin name (CLI binary). Defaults to package name when not set. Must match /^[a-z][a-z0-9-]*$/.",
              reducer:
                "if (!/^[a-z][a-z0-9-]*$/.test(action.input.bin)) {\n  throw new InvalidNameError(`Invalid bin name: ${action.input.bin}`);\n}\nstate.bin = action.input.bin;",
              errors: [
                {
                  id: "e-set-bin-invalid",
                  name: "InvalidNameError",
                  code: "INVALID_NAME",
                  description:
                    "The bin name must match /^[a-z][a-z0-9-]*$/ \u2014 same rule as the package name.",
                  template: "Invalid bin name: {{bin}}",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "o-set-description",
              name: "SET_DESCRIPTION",
              description: "Set the package description.",
              schema: "input SetDescriptionInput {\n  description: String!\n}",
              template: "Set the package description.",
              reducer: "state.description = action.input.description;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "o-set-version",
              name: "SET_VERSION",
              description:
                "Set the package version. Must be a valid semver string.",
              schema: "input SetVersionInput {\n  version: String!\n}",
              template:
                "Set the package version. Must be a valid semver string.",
              reducer:
                "if (!/^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$/.test(action.input.version)) {\n  throw new InvalidVersionError(`Invalid version: ${action.input.version}`);\n}\nstate.version = action.input.version;",
              errors: [
                {
                  id: "e-set-version-invalid",
                  name: "InvalidVersionError",
                  code: "INVALID_VERSION",
                  description:
                    "The version must be a valid semver string (major.minor.patch, optionally with prerelease/build metadata).",
                  template: "Invalid version: {{version}}",
                },
              ],
              examples: [],
              scope: "global",
            },
            {
              id: "o-clear-scope",
              name: "CLEAR_SCOPE",
              description: "Clear the npm scope.",
              schema: "input ClearScopeInput {\n  _: Boolean\n}",
              template: "Clear the npm scope.",
              reducer: "state.scope = null;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "o-set-scope",
              name: "SET_SCOPE",
              description:
                "Set the npm scope (organization), stored without the '@' prefix. Must match /^[a-z][a-z0-9-]*$/.",
              schema: "input SetScopeInput {\n  scope: String!\n}",
              template:
                "Set the npm scope (organization), stored without the '@' prefix. Must match /^[a-z][a-z0-9-]*$/.",
              reducer:
                "if (!/^[a-z][a-z0-9-]*$/.test(action.input.scope)) {\n  throw new InvalidScopeError(`Invalid scope: ${action.input.scope}`);\n}\nstate.scope = action.input.scope;",
              errors: [
                {
                  id: "e-set-scope-invalid",
                  name: "InvalidScopeError",
                  code: "INVALID_SCOPE",
                  description:
                    "The scope must match /^[a-z][a-z0-9-]*$/ and must not include the '@' prefix (it is stored without it).",
                  template: "Invalid scope: {{scope}}",
                },
              ],
              examples: [],
              scope: "global",
            },
          ],
        },
        {
          id: "m-features-powerhouse",
          name: "features_powerhouse",
          description:
            "Powerhouse feature toggle. Enabling is irreversible (no disable op); flat\u2192split migration is one-way.",
          operations: [
            {
              id: "o-enable-powerhouse",
              name: "ENABLE_POWERHOUSE",
              description:
                "Enable the Powerhouse feature. Irreversible: there is no disable operation because the flat\u2192split project-layout migration is one-way. Idempotent: re-enabling when already on is a no-op.",
              schema: "input EnablePowerhouseInput {\n  _: Boolean\n}",
              template:
                "Enable the Powerhouse feature. Irreversible: there is no disable operation because the flat\u2192split project-layout migration is one-way. Idempotent: re-enabling when already on is a no-op.",
              reducer: "state.features.powerhouse.enabled = true;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "o-set-powerhouse-switchboard",
              name: "SET_POWERHOUSE_SWITCHBOARD",
              description:
                "Toggle whether the Powerhouse Switchboard is included in the generated project. Has no observable effect while Powerhouse is disabled, but the preference is preserved.",
              schema:
                "input SetPowerhouseSwitchboardInput {\n  enabled: Boolean!\n}",
              template:
                "Toggle whether the Powerhouse Switchboard is included in the generated project. Has no observable effect while Powerhouse is disabled, but the preference is preserved.",
              reducer:
                "state.features.powerhouse.switchboard = action.input.enabled;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "o-set-powerhouse-connect",
              name: "SET_POWERHOUSE_CONNECT",
              description:
                "Toggle whether Connect is included in the generated project. Has no observable effect while Powerhouse is disabled, but the preference is preserved.",
              schema:
                "input SetPowerhouseConnectInput {\n  enabled: Boolean!\n}",
              template:
                "Toggle whether Connect is included in the generated project. Has no observable effect while Powerhouse is disabled, but the preference is preserved.",
              reducer:
                "state.features.powerhouse.connect = action.input.enabled;",
              errors: [],
              examples: [],
              scope: "global",
            },
          ],
        },
        {
          id: "m-features-mastra",
          name: "features_mastra",
          description:
            "Mastra agent feature toggle. Enabling also enables Routine (mastra requires the routine loop).",
          operations: [
            {
              id: "o-enable-mastra",
              name: "ENABLE_MASTRA",
              description:
                "Enable the Mastra agent feature. Also enables Routine automatically because Mastra agents rely on the routine loop. Idempotent.",
              schema: "input EnableMastraInput {\n  _: Boolean\n}",
              template:
                "Enable the Mastra agent feature. Also enables Routine automatically because Mastra agents rely on the routine loop. Idempotent.",
              reducer:
                "state.features.mastra.enabled = true;\nstate.features.routine.enabled = true;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "o-disable-mastra",
              name: "DISABLE_MASTRA",
              description:
                "Disable the Mastra agent feature. Does not affect Routine \u2014 disable that separately if desired.",
              schema: "input DisableMastraInput {\n  _: Boolean\n}",
              template:
                "Disable the Mastra agent feature. Does not affect Routine \u2014 disable that separately if desired.",
              reducer: "state.features.mastra.enabled = false;",
              errors: [],
              examples: [],
              scope: "global",
            },
          ],
        },
        {
          id: "m-features-routine",
          name: "features_routine",
          description:
            "Routine loop feature toggle. Cannot be disabled while Mastra is enabled.",
          operations: [
            {
              id: "o-enable-routine",
              name: "ENABLE_ROUTINE",
              description: "Enable the routine loop. Idempotent.",
              schema: "input EnableRoutineInput {\n  _: Boolean\n}",
              template: "Enable the routine loop. Idempotent.",
              reducer: "state.features.routine.enabled = true;",
              errors: [],
              examples: [],
              scope: "global",
            },
            {
              id: "o-disable-routine",
              name: "DISABLE_ROUTINE",
              description:
                "Disable the routine loop. Fails with MastraRequiresRoutineError when Mastra is enabled.",
              schema: "input DisableRoutineInput {\n  _: Boolean\n}",
              template:
                "Disable the routine loop. Fails with MastraRequiresRoutineError when Mastra is enabled.",
              reducer:
                "if (state.features.mastra.enabled) {\n  throw new MastraRequiresRoutineError('Cannot disable routine while Mastra is enabled');\n}\nstate.features.routine.enabled = false;",
              errors: [
                {
                  id: "e-disable-routine-mastra-on",
                  name: "MastraRequiresRoutineError",
                  code: "MASTRA_REQUIRES_ROUTINE",
                  description:
                    "Routine cannot be disabled while Mastra is enabled. Disable Mastra first, then Routine.",
                  template:
                    "Cannot disable routine: Mastra is currently enabled",
                },
              ],
              examples: [],
              scope: "global",
            },
          ],
        },
      ],
      version: 1,
      changeLog: [],
    },
  ],
};
