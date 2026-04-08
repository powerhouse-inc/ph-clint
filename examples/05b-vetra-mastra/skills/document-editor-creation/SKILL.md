---
name: document-editor-creation
description: "Skill for document editor creation. Provides step-by-step guidance for completing document editor creation tasks."
metadata:
  author: Powerhouse
  version: "1.0.0"
---

=== BEGIN SKILL BRIEFING === 

IMPORTANT:  Don't take any action yet. You will be guided through your tasks after the briefing(s). Just process and confirm your understanding.

# Document Editor Creation - Skill Preamble

With this skill, you can design and implement new Reactor 'document editor' and 'drive app' modules for the Powerhouse ecosystem. Your role is to work for stakeholders 
by creating these modules based on their needs. This briefing teaches you about general editor building practices. Refer to specific tasks before 
applying the relevant portions of this information. 

## Document Editor Creation principles

When the user requests to create or make changes on a document editor, follow these steps:

- Check if the document editor already exists and if it does, ask the user if a new one should be created or if the existing one should be reimplemented
- If it's a new editor, create a new editor document on the "vetra-{hash}" drive if available, of type `powerhouse/document-editor`
- Check the document editor schema and comply with it
- After adding the editor document to the Vetra drive, a new editor will be generated in the `editors` folder
- Inspect the hooks in `editors/hooks` as they should be useful
- Read the schema of the document model that the editor is for to know how to interact with it
- Style the editor using tailwind classes or a style tag. If using a style tag, make sure to make the selectors specific to only apply to the editor component.
- Create modular components for the UI elements and place them on separate files to make it easier to maintain and update
- Consider using the React Components exported by `@powerhousedao/design-system` and `@powerhousedao/document-engineering`
- Separate business logic from presentation logic
- Use TypeScript for type safety, avoid using any and type casting
- Always check for type and lint errors after creating or modifying the editor

## Document Editor Implementation Pattern

**CRITICAL**: When implementing document editors, use the modern React hooks pattern from `@powerhousedao/reactor-browser`.

The following section is valid for editors that edit a single document type.

### Required Imports and Setup

Using a "Todo" document model as example:

```typescript
import { generateId } from "document-model/core";
import { useSelectedTodoDocument } from "../hooks/useTodoDocument.js";
import {
  addTodo,
} from "../../document-models/todo/gen/creators.js";

export default function Editor() {
  const [document, dispatch] = useSelectedTodoDocument();

  function handleAddTodo(values: { title: string }) {
    if (values.title) {
      dispatch(addTodo({ id: generateId(), title: values.title }));
    }
  };
```

The `useSelectedTodoDocument` gets generated automatically so you don't need to implement it yourself.

## ⚠️ CRITICAL: Generated Files & Modification Rules

### Generated Files Rule

**NEVER edit files in `gen/` folders** - they are auto-generated and will be overwritten.

### Document Model Modification Process

For ANY document model changes, follow this **mandatory** two-step process:

#### Step 1: Update Document Model via MCP

Use `reactor-mcp__addActions` with operations like:

- `SET_OPERATION_SCHEMA` - update input/output schemas
- `SET_OPERATION_REDUCER` - update reducer code
- `SET_STATE_SCHEMA` - update state definitions

#### Step 2: Update Existing Source Files

**ALSO manually update existing reducer files in `src/` folder** - these are NOT auto-generated.
Make sure to check if the operation reducer code needs to be updated after changing the state schema.

### ⚠️ Critical Reminder

**ALWAYS do BOTH steps when fixing reducer issues:**

1. ✅ Fix existing reducer files in `src/` manually
2. ✅ Update document model via MCP with same fixes

**Forgetting step 2 means future code generations will still contain the bugs!**

=== END SKILL BRIEFING ===

# ED.00 Check the prerequisites for creating a document model

For this scenario, you will write TypeScript code in the active Reactor Package project directory that you can find through the project management tools MCP tool.
    - Use the the project management tools MCP tool to (re)start Vetra Studio and Switchboard if needed.
    - Use the the project management tools MCP tool to inspect the logs
    
Read the `AGENTS.md` in the project directory for best practices

Use the Reactor MCP tools 
    - to access the Vetra drive and inspect the document model specification document
    - to access the preview drive and create test documents when appropriate

Do not run the `ph vetra` or `ph generate` commands for anything, instead use the the project management tools MCP tool

Code is regenerated automatically by Vetra.
    - Review bugs and errors in the GraphQL types if the code generator is stuck
    - Review and update the document model specification in the Vetra drive to fix type errors in the generated code
    - Consider restarting the project (/ the Vetra service) through the the project management tools tool if needed

## ED.00.1 Familiarize yourself with the document model

- Read the document model specifications in the Vetra drive for context
- In the `./src/document-models` folder, confirm you see the types and code for reducers and explore their functionality
- Run `pnpm test` to verify all tests are passing
- Run `pnpm build` to detect type errors

Fix any issues you may detect

## ED.00.2 Ensure the editor specification document exists in Vetra Drive

- Check the Vetra drive to confirm if a preliminary document editor specification 
  (formal type: `powerhouse/document-editor`) already exists for the document model you
  want to create it for. 

- If it already exists, note the document ID in the task outcome

- If it does not exist already, create it first before proceeding
  - Remember: When creating _any_ document in a drive, including this, NEVER set the document ID manually. They're auto-generated by 'createDocument'.
  - Make sure to set the name and add the document to the correct drive
  - After adding it, ensure you see the document model in the Vetra drive

## ED.00.3 Confirm the document type and editor name

- Use `ADD_DOCUMENT_TYPE` to add support for your document type to the editor
- Use `SET_EDITOR_NAME` to set the editor name as it will appear in the code base
- Confirm the document type and editor name by setting the editor status (`SET_EDITOR_STATUS`) to "CONFIRMED"

## ED.00.4 Verify the code generation was triggered and boilerplate code was created

- Verify the editor boilerplate was created in ./editors/<editor-name>
- Explore the boilerplate code, which you can recognize by the usage of the <DocumentStateViewer> component

# ED.01 Write the editor implementation

For this scenario, you will write TypeScript code in the active Reactor Package project directory that you can find through the project management tools MCP tool.
    - Use the the project management tools MCP tool to (re)start Vetra Studio and Switchboard if needed.
    - Use the the project management tools MCP tool to inspect the logs
    
Read the `AGENTS.md` in the project directory for best practices

Use the Reactor MCP tools 
    - to access the Vetra drive and inspect the document model specification document
    - to access the preview drive and create test documents when appropriate

Do not run the `ph vetra` or `ph generate` commands for anything, instead use the the project management tools MCP tool

Code is regenerated automatically by Vetra.
    - Review bugs and errors in the GraphQL types if the code generator is stuck
    - Review and update the document model specification in the Vetra drive to fix type errors in the generated code
    - Consider restarting the project (/ the Vetra service) through the the project management tools tool if needed

## ED.01.1 Verify code generation and clean up the boilerplate code

- Verify the editor was created in ./editors/<editor-name>

- Check if the boilerplate code is still present and remove it
  - You can recognize the boilerplate by the usage of the <DocumentStateViewer> component
  - If it's still in the main editor.tsx file, remove the code but leave the imports as hints, and also the document toolbar
  - If the boilerplate is no longer present, it may have been deleted previously

- Verify that the editor has a <DocumentToolbar /> and if not, then add it
  - The document toolbar is imported from "@powerhousedao/design-system/connect/index"
  - It allows the user to export the document to a .phd file, view its operation history and get access to 
    the corresponding switchboard API endpoint for data processing / integration.

- Verify `pnpm test` is showing no issues
- Verify `pnpm build` is running without issues

## ED.01.2 Ensure that test documents have been generated

- Access the Preview Drive through the Reactor MCP tools and look if any test documents are available

- If there few or no test documents available, create a number of new test documents for the document model you're working on

    - Remember: When creating _any_ document in a drive, including this, NEVER set the document ID manually. They're auto-generated by 'createDocument'

    - Consider adding a small, medium and large example document

    - If the document model has a workflow with multiple statuses, create documents, or objects within a document, in various stages of their life cycle

- Inform the stakeholder that test document are available, where they can viewed, and mention you're working on the editor now.

## ED.01.3 Implement viewing functionality

Focus on the document reading experience first. Review any existing document editor code and determine if all the document state information can be comfortably explored in the document editor.

If state information is inaccessible, consider how to expose it in the UI.

**Decide which paradigm(s) to use**

a. First of all, consider if the document type in question has a standardized way in which it is typically presented. If this is the case, just stick to the standard. 

  - Many documents fall into this category: calendar-like, kanban-like, chat-like, spreadsheet-like ... documents, and even board games.
  - If a common standard lay-out is available, then use it.

b. If no standard lay-out is immediately apparent, consider a traditional document flow paradigm where there is single view where paragraphs / sections / items / ... 
    can be edited and added to the "page", and the view expands down with a scrollbar. Similar to platforms such as Notion.

    Example documents that can use this paradigm are all variants of text documents, single forms, single invoices, specification documents, etc. These documents lend themselves perfectly for PDF exporting or printing.

    Their strength comes from the pleasant reading experience with an information architecture that is aimed at processing information thoroughly and sequentially. The editing experience often focuses on the creative process of producing the document's content. It encourages deep/focused thinking rather than mechanically using the document as an information tracking and coordination tool.

c. Alternatively, consider following more of an app paradigm, optionally with a full-height interface, and a more
    intricate navigation structure using tabs, menus, etc. This is ideal for documents that act more like databases
    where information is stored, searched for, consumed selectively and edited for the purpose of tracking and coordination.

    Example documents that use this paradigm are: collections, catalogues, etc. where the focus is more on discoverability, quick information retrieval and scattered updates to keep the information up-to-date.

d. Use a mix of (b) and (c). Often the main part of the document has a traditional flow, but there are sections such as 
    settings/configuration, option lists, ... that are more functional than creative/focused.

**Design Styles**

Unless otherwise specified, stick to a sober, generic SaaS-style design for business use cases: white editor background, rounded corners, grey accent backgrounds and borders, soft edges, subtle use of shadows, and color usage mostly for labels, chips, etc. and warnings/errors/etc.

**Structure the information navigation**

With the paradigm choice(s) in mind, consider which UI patterns will match:

- Consider adding a sidebar for displaying the root level properties that are scalars, scalar arrays or single 
  object children with simple child properties. This leaves the main area open for the more complex data.

- If there isn't enough root level information to warrant a sidebar, consider a header instead.

- Consider adding tables in the main area for object collections at the root level of the document.
  - If the collection's objects only have a few properties, consider adding all properties as table columns
  - For collections with many object properties, consider making rows selectable and showing the full state 
    only in the sidebar pane

- For nested collections, consider creating an inbox-style UI where the top-level collection's item summaries are shown
  in the sidebar and are selectable. Once selected, the main area can show a header with the full item details, and it 
  can show the nested collections below that header.

- Use <img> tags for URL fields that refer to images. Make sure to set the appropriate dimensional constraints.

- Use tabs only sparingly.

**Generate the reading experience code**

- Define components following the design choices and make sure to keep a clean file structure
- Focus on one component at a time
- Bring them all together in a lay-out that is fitting for the earlier design decisions
- Make sure to keep the <DocumentToolbar/> at the top and don't put anything next to it.

## ED.01.4 Implement editing functionality

Implement document editing features until all operations can be triggered 

### Implement UI elements that call `dispatch`

- Start by making as much as the state values in the reading experience in-line editable.

  - Use buttons, icons, toggles or checkboxes for actions that don't need input entered by the user, 
    for example removing objects, binary status changes, moving objects up/down in a collection, etc. 

  - Use a single input field with dispatch on blur for actions that need only a singe input parameter entered by 
    the user. For example single property setters, creation of objects that only have one (mandatory) property 
    that the user needs to enter, etc. 

  - Use an inline form where only a few properties need to be provided and there is space available in the UI.

- For the creation of larger objects and situations where the UI does not have space for inline editing, use the sidebar pane
  and pop-over modals with a semi-transparent black overlay in the background. These can facilitate more extensive forms, 
  and even multi-step input processes.

- Make images editable by providing a pop-up with a URL field and preview.

- Avoid "edit" or "edit mode" buttons where possible. Make fields and objects editable upon hover with inline forms as described.

- Make sure to keep the <DocumentToolbar/> at the top and don't put anything next to it.

### Checklist

- Ensure that the user can directly or indirectly edit all reachable parts of the state
- Ensure that the user can add and remove new objects to/from collections where the operations permit this
- Check that all dispatch calls use strong typing and that the proper parameters are passed everywhere

## ED.01.5 Resolve outstanding issues

- Run `pnpm build` to verify that all typing issues have been resolved. If issues remain, then fix them.

  - **NEVER** use `any` or strong type casts in the document model reducers or their arguments. 
    Keep the reducers' code strictly typed at all times. They are the critical business logic that requires 

  - **NEVER** use `any` or strong type casts in the document editor dispatch calls. 
    Keep `dispatch` and its arguments strictly typed. It is the best guarantee that the editor will work well.

  - Avoid using `any` in other situations too. Typing issues should be resolved fundamentally.

- Run `pnpm lint:fix` to detect linter issues and auto-fix where possible

  - Resolve the remaining linter issues before proceeding.

- Run `pnpm test` to ensure that the unit tests are still passing. 

## ED.01.6 Stakholder communication

Send the stakeholder a message to ask them to participate in the user acceptance test
  - Share the Vetra Studio URL with them 
  - Explain that they can find the document model and editor specification in Vetra Drive
  - Explain that they can do user acceptance testing in the Preview Drive
