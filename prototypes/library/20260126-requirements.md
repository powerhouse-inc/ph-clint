# Requirements ph init / vetra

## Boilerplate Templates

### Template parameter

Add an additional parameter to `ph init` to identify the boilerplate repo

```bash
ph init --template reactor-package my-package   # --template = reactor-package for the current boilerplate
ph init -t reactor-package my-package           # -t shorthand
ph init my-package                              # default value = 'reactor-package'

ph init -t fusion my-platform                   # template 'fusion' will instantiate a next.js boilerplate 
                                                # set up for renown + switchboard as back-end

ph init -t agent my-agent                       # template 'agent' will instantiate a boilerplate 
                                                # for the development of new agents
```

### Github repositories mapping

 - reactor-package : ~~`https://github.com/powerhouse-inc/document-model-boilerplate`~~ -> in the mono repo now
 - fusion : `https://github.com/powerhouse-inc/fusion-boilerplate`
 - agent : `https://github.com/powerhouse-inc/agent-boilerplate`

### Existing parameters changes

- Remove the existing `-t` shorthand for tags.
- Add `--latest` for consistency
- Add `-m` as shorthand for `--package-manager`

#### Update documentation

```md
Options:
  -p, --project         Specify the name of the project to create.

  -t, --template        Specify which project template to use. Options are "reactor-package" (default), "fusion", or "agent"

  -i, --interactive     Run the command in interactive mode, which will guide you           -> should ask for "template" and "project name"
                        through the project setup with customizable options.
  
  --tag                 Version of the Powerhouse dependencies to use. Defaults to "main"
                        
  --dev                 Use the "development" version of the template.
                        
  --staging             Use the "staging" version of the template.

  --latest              Use the "latest" version of the template.

  -b, --branch          Specify custom boilerplate branch to use.
                        
  -m, --package-manager     Override the auto-detected package manager with the specified one.
```

#### Version config

`--tag`, `--dev`, `--staging`, `--latest` should apply in the same way: checking out specific versions of the boilerplate

## General `ph vetra`

Generalize `ph vetra` to support a common methodology for all projects: 
 - Uses Vetra Studio (Connect) and a Vetra Drive for specification documents
 - `--connect-port <port>` configures the Vetra Studio port
 - Uses Vetra Switchboard for code generation based on specification documents
 - `--switchboard-port <port>` configures the Vetra Switchboard port
 
`ph vetra` starts both services

### Vetra Configs

`powerhouse.config.json` to be renamed to `vetra.config.json`

#### Common Settings
```json
{
  "template":  <title>,
  "ports": {
    "studio": 3000,
    "switchboard": 4001,
  },
  "packages": [
    {
      "packageName": "@powerhousedao/vetra",
      "version": "latest",
      "provider": "npm"
    }
  ],
  "drives": []
}
```

#### Reactor Package Projects
Actual values may differ.
```json 
{
  "drives": [
    {
        "id": "vetra-10e97b52",
        "editor": "vetra-studio-reactor-package"
    },
    {
        "id": "preview-10e97b52",
        "editor": "default-drive-explorer"
    }
  ],
  "folders": {
    "documentModelsDir": "./document-models",
    "editorsDir": "./editors",
    "processorsDir": "./processors",
    "subgraphsDir": "./subgraphs",
  }
}
```

#### Fusion Projects
Actual values may differ.
```json 
{
  "packages": [
    {
      "packageName": "@powerhousedao/vetra",
      "version": "latest",
      "provider": "npm"
    },
    {
      // contains fusion template specific specification docs + 'vetra-studio-fusion' drive explorer
      "packageName": "@powerhousedao/vetra-fusion",
      "version": "latest",
      "provider": "npm"
    }
  ],
  "drives": [
    {
        "id": "vetra-10e97b52",
        "editor": "vetra-studio-fusion"
    }
  ],
}
```

#### Agent Projects
Actual values may differ.
```json 
{
  "packages": [
    {
      "packageName": "@powerhousedao/vetra",
      "version": "latest",
      "provider": "npm"
    },
    {
      // contains agent template specific specification docs + 'vetra-studio-agent' drive explorer
      "packageName": "@powerhousedao/vetra-agent",
      "version": "latest",
      "provider": "npm"
    }
  ],
  "drives": [
    {
        "id": "vetra-10e97b52",
        "editor": "vetra-studio-agent"
    }
  ],
}
```