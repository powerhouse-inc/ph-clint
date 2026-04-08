---
name: document-modeling
description: "Design Powerhouse document models with state schemas, operations, and reducers"
metadata:
  author: Powerhouse
  version: "1.0.0"
---

=== BEGIN SKILL BRIEFING === 

IMPORTANT:  Don't take any action yet. You will be guided through your tasks after the briefing(s). Just process and confirm your understanding.

# Document Modeling - Skill Preamble

With this skill, you can design and implement new Reactor 'document model' modules for the Powerhouse ecosystem. Your role is to work for stakeholders 
by creating these modules based on their needs. This briefing teaches you about general document modeling practices. Refer to specific tasks before 
applying the relevant portions of this information. 

## Document Model Creation Principles

### 1. Planning

**MANDATORY**: Present your proposal to the user and ask for confirmation before implementing ANY document model.

- **ALWAYS** describe the proposed document model structure (state schema, operations, modules) before creating
- **NEVER** proceed with implementation without explicit user approval of your proposal
- When in doubt, ask for clarification
- Break complex models into logical modules and operations

### 2. Pre-Implementation Requirements

**MANDATORY**: Check document model schema before making any MCP tool calls.

- **ALWAYS** use `reactor-mcp__getDocumentModelSchema` with `type: "powerhouse/document-model"` first
- Review input schema requirements for operations like `ADD_MODULE`, `ADD_OPERATION`, etc.
- Ensure all required parameters (like `id` or `scope` fields) are included in action inputs
- This prevents failed tool calls and reduces iteration

### 3. Implementation Requirements

- Document model reducers must be **pure synchronous functions**
- Reducers receive current state and operation, always returning the same result
- Values like dates/IDs must come from operation input, not generated in reducer
- Reducer code goes into SET_OPERATION_REDUCER action (no function header needed)
- Reducers are wrapped with Mutative - you can mutate the state object directly
- External imports go at the beginning of the actual reducer file in `src/`
- Ensure that the reducer code of each operation in the document model schema is applied in `document-models/<document-model-name>/src/reducers/<module-name>.ts`

### 4. Quality assurance

After doing changes to the code, or after creating a new document model or a new editor, _YOU MUST RUN_ the following commands to check for errors in your implementation:

- **TypeScript Check**: Run `npm run tsc` to validate type safety
- **ESLint Check**: Run `npm run lint:fix` to check for errors with ESLint

## Best Practices 

### Scope Selection

- **`scope: "global"`**: State shared among all users with document access
- **`scope: "local"`**: State private to each individual user

### Operation Design

- Use descriptive operation names (e.g., `ADD_LINE_ITEM`, `UPDATE_RECIPIENT`)
- One operation per user intent (separate concerns)
- Include comprehensive examples and error definitions
- Organize related operations into logical modules

## Reducer Implementation Guidelines

### ❌ Forbidden in Reducers (Non-Deterministic)

- `crypto.randomUUID()`, `Math.random()`, `Date.now()`, `new Date()`
- External API calls or side effects
- Asynchronous functions
- Any non-deterministic functions

### ❌ Forbidden Patterns

```typescript
// NEVER use fallback values with non-deterministic functions
id: action.input.id || crypto.randomUUID(); // ❌ FORBIDDEN
timestamp: action.input.timestamp || new Date(); // ❌ FORBIDDEN
```

### ✅ Required Pattern

All dynamic values must come from action input:

- **IDs**: Include `id: OID!` in input schema, use `action.input.id` in reducer
- **Timestamps**: Include `timestamp: DateTime!` in input schema
- **Computed values**: Calculate before dispatching action

### Example

```typescript
// ❌ BAD - impure reducer
const newItem = {
  id: crypto.randomUUID(), // Non-deterministic
  createdAt: new Date(), // Non-deterministic
};

// ✅ GOOD - pure reducer
const newItem = {
  id: action.input.id, // From action input
  createdAt: action.input.createdAt, // From action input
};
```

### Handling Nullable Input Types

**CRITICAL**: Be careful when handling optional input types:

- Optional input types use `InputMaybe<T>` allowing `null | undefined | T`.
- Optional state types use `Maybe<T>` = `T | null`.
- If there is no applicable default value then use `|| null`.

```typescript
// ❌ BAD - Type error with Maybe<string>
amount: action.input.amount,
notes: action.input.notes,

// ✅ GOOD - Matches Maybe<T> = T | null
amount: action.input.amount || null,
notes: action.input.notes || [],
```

Use truthy checks when conditionally assigning optional values from input to state:

```typescript
// ❌ BAD - Type 'string | null' is not assignable to type 'string'.
if (action.input.field !== undefined) entry.field = action.input.field;

// ✅ GOOD - use truthy checks
if (action.input.field) state.field = action.input.field;

// ✅ GOOD - For booleans use explicit null/undefined checks
if (action.input.field !== undefined && action.input.field !== null)
  state.field = action.input.field;
```

## GraphQL Schema Guidelines

### Document State Schema

- **Most fields optional** to support creating empty documents
- Use required fields `!` only when absolutely necessary
- Defaults handled by operations, not schema

### ⚠️ CRITICAL: State Type Naming Convention

**MANDATORY**: The global state type name MUST follow this exact pattern:

```graphql
type <DocumentModelName>State {
    # your fields here
}
```

**DO NOT** append "Global" to the state type name, even when defining global state:

```graphql
// ❌ WRONG - Do not use "GlobalState" suffix
type TodoListGlobalState {
    todos: [Todo!]!
}

// ✅ CORRECT - Use only "State" suffix
type TodoListState {
    todos: [Todo!]!
}

// ✅ CORRECT - Use "LocalState" suffix for Local scope
type TodoListLocalState {
    localTodos: [Todo!]!
}
```

**Why this matters:**

- The code generator expects the type to be named `<DocumentModelName>State`
- Using `GlobalState` or `LocalState` suffix will cause TypeScript compilation errors
- This applies when using `SET_STATE_SCHEMA` with `scope: "global"`

**Rule**: For global state, the type should be `<DocumentModelName>State`. For local state (if needed), the type name should be `<DocumentModelName>LocalState`.

### Available Scalar Types

| Standard  | Custom Identity                   | Custom Amounts      | Custom Specialized |
| --------- | --------------------------------- | ------------------- | ------------------ |
| `String`  | `OID` (Object ID)                 | `Amount`            | `EthereumAddress`  |
| `Int`     | `PHID` (Powerhouse document ID)   | `Amount_Tokens`     | `EmailAddress`     |
| `Float`   | `OLabel`                          | `Amount_Money`      | `Date`             |
| `Boolean` |                                   | `Amount_Fiat`       | `DateTime`         |
|           |                                   | `Amount_Currency`   | `URL`              |
|           |                                   | `Amount_Crypto`     | `Currency`         |
|           |                                   | `Amount_Percentage` |                    |

### Arrays and Objects

- **Arrays**: Must be mandatory `[ObjectType!]!`
- **Objects in arrays**: Must include `id: OID!` field for unique identification
- Include `OLabel` for metadata when relevant

### Input Types

- Reflect user intent with descriptive names
- Simple, specific fields over complex nested types

## Error Handling in Operations

**MANDATORY**: Define specific error types for each operation to handle invalid inputs and edge cases properly.
Action inputs are validated so they are guaranteed to respect the input schema.
Errors referenced in the reducer code will be imported automatically.

### Error Definition Requirements

1. **Add error definitions** to operations using `ADD_OPERATION_ERROR`:

   - `code`: Uppercase snake_case (e.g., `"MISSING_ID"`, `"ENTRY_NOT_FOUND"`)
   - `name`: PascalCase ending with "Error" (e.g., `"MissingIdError"`, `"EntryNotFoundError"`)
   - `description`: Human-readable description of the error condition

2. **Error names must end with "Error"** for consistency and code generation

3. **Use specific error types** rather than generic validation

4. **Must use unique error names and ids**

### Error Usage in Reducers

```typescript
// ✅ GOOD - Throw specific errors by name
if (!action.input.id) {
  throw new MissingIdError("ID is required for operation");
}

if (entryIndex === -1) {
  throw new EntryNotFoundError(`Entry with ID ${action.input.id} not found`);
}

// ❌ BAD - Generic Error
throw new Error("Something went wrong");

// ❌ BAD - Nested error access
throw new errors.ModuleName.MissingIdError("message");

// ❌ BAD - Do not import error classes in the reducer code,
import { MissingIdError } from "../../gen/module-name/error.js";

// ✅ GOOD - Simply reference the error and it will be imported automatically
throw new MissingIdError("message");
```

### Common Error Patterns

- **EntityNotFoundError**: Referenced entity doesn't exist
- **DuplicateIdError**: ID already exists when creating new entries
- **InvalidInputError**: Business logic violations
- **PermissionDeniedError**: Access control violations

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

=== END OF SKILL BRIEFING ===

# DM.00 Check the prerequisites for creating a document model

Note on task management: 
- The creation of a new document model is associated with a single goal/task in your WBS document.
- Add notes to remember your progress and update the goal status in your WBS document as you go along.

## DM.00.1 Ensure you have the required input and context

- Ensure you know who the stakeholder is who is requesting the new document model.
- Ensure you can contact the stakeholder through your inbox to ask questions and share updates.
- Ensure you have identified the WBS goal associated with the task. Create a new goal if needed.
- Rephrase the stakeholder request for clarity if needed.
- Ensure you know at least the informal name of the new document model and who the users are.
- Ensure that you know which Reactor Package project this document model will be in.

### Expected Task Outcome
The required input and context are available and the agent is ready to perform the next task.

## DM.00.2 Use the ReactorPackagesManager to run Vetra Connect and Switchboard

- List the available reactor package projects and confirm it includes the one you need
- Check which project is running, if any. If another project is running, shut it down first.
- Start the project you need if it's not running yet.
- Once the project is running, request the MCP endpoint from the project management tools 
  and verify you can access it through the Reactor MCP tools
- Request the Vetra drive from the project management tools and verify you see it through the MCP endpoint.
- Verify that you see the accompanying preview drive too.

## DM.00.3 Review the existing package specs and implementation

Use the `reactor-mcp__*` tools to complete this task.

- Review any existing specification documents in the Vetra drive and consider how the new document model 
  will fit in.
- Review the package implementation code in the project folder to get a good understanding of the
  existing functionality.
- Run the project unit tests and confirm that they are passing.
- Ensure that there are no pending previous changes. Commit outstanding changes if needed.

## DM.00.4 Ensure the Reactor Package information is sufficiently updated

Use the `reactor-mcp__*` tools to complete this task.

- Read the `powerhouse/package` document in the Vetra drive and check if the information is complete.

  - If the document does not exist yet, create a new one for your package before proceeding with the creation
    of document models and other specification documents.

- Consider the potentially expanded package scope with the new document model that will be added. Consider 
  what an improved name, description, category, publisher + url and keywords could be.

- Decide if it's worth to update the information. 
    
    - If you created a new thepackage document, update it with the information you came up with. 

    - If the package document already existed: 
        - Don't be too strict as you should not update the package information often. If the existing data still fits 
          the purpose, then leave it.
        - If you do decide to update the information, ask the stakeholder for confirmation first. 

### Expected Task Outcome
The Reactor Package information is up-to-date and reflects the expanded scope. 

## DM.00.5 Provide a stakeholder update

- Request the Vetra Connect, Switchboard and MCP endpoints from the project management tools
- Notify the stakeholder that you started the document modeling task and summarize your task for them
  based on your considerations to this point
- Make sure to share the Connect, Switchboard and MCP endpoints with the stakeholder for them to follow along.

## Expected Scenario Outcome

All prerequisites are in place the agent to start writing the document model description.

# DM.01 Write the document model description

Make extensive use of the Reactor MCP tools for this scenario DM.01. 
- Do not make any changes in the code yet!
- Do not create any files but always use the MCP tools for accessing documents.

## DM.01.1 Ensure the document model specification document exists in Vetra drive

- Check the Vetra drive to confirm if a preliminary document model specification 
  (formal type: `powerhouse/document-model`) already exists for the document model you
  want to create. 

- If it already exists, note the document ID in the task outcome

- If it does not exist already, create it first before proceeding
  - Remember: When creating _any_ document in a drive, including this, NEVER set the document ID manually. They're auto-generated by 'createDocument'.
  - Make sure to set the name and add the document to the correct drive
  - After adding it, ensure you see the document model in the Vetra drive

## DM.01.2 Start by listing the users who will use the new document model

### Example

```
- Pizza Plaza restaurant owner
- Pizza Plaza customers
- Pizza Plaza kitchen chefs
```

## DM.01.3 Come up with a good, concise description

A good description includes its users, how they will use the document in a typical workflow, and it narrows 
its scope as much as possible by describing what will not be included.

### Example

```
The Pizza Plaza order document will be used by the restaurant owner, their customers and the kitchen chefs. 
The restaurant owner will prepare the document by defining the menu categories, options and prices in it. 
The customer will then use this menu to add the pizzas, sides and drinks they want to order to their basket. 
They will see the itemized prices and the total. Once the order is placed, a kitchen chef will check off the
items one by one as ready.

The order document does not support customization options for the items and it does not track the entire lifecycle
of payment, delivery, etc. It is meant to be a reliable reference for what the restaurant offers, what the customers 
wants, and what the kitchen has prepared.
```

### Restrictions 
- The description must not be longer than two or three paragraphs of text
- The scope of a document model should be "small" in the sense that the state of the documents it describes 
  should not contain more than a couple of kilobytes of JSON on average.
- The document model should be "simple" in the sense that it should focus on a single purpose and its business 
  logic should be precise and predictable: easy to implement and test.

### Wrap-up

Use the `reactor-mcp__*` tools to verify that all details are correctly written to the 
document model specification in Vetra Studio drive.

## DM.01.4 Fill out the remaining header fields

### Document Type and Name

- The document type must be of the form `{organization}/{document-type-name}`
  - For example: `pizza-plaza/order`

- Make sure that the name is set in a human-readable, capitalized form
  - For example: `Pizza Plaza Order`
  - Make sure all extra spacing is removed and each word is capitalized
  - The name must match `/[a-zA-Z][a-zA-Z0-9 ]*/`. This is critical for the state schema later,
    which uses this name to derive the root type name.

### Document File Extension

- Reduce the document type to an abbreviation of 2 to 4 characters with a dot in front
- Avoid abbreviations with problematice connotations
- For example: `pizza-plaza/order` => `.ppo`
- For example: `software-engineering/xml` => `.sxml`, not `.sex`

### Author fields

- Fill out the author name with yours

- Fill out the website URL with the stakeholder's if you know it, or the package publisher's URL. 
  If both are unknown, use 'https://powerhouse.inc' as a default.

### Wrap-up

Use the `reactor-mcp__*` tools to verify that all details are correctly written to the 
document model specification in Vetra Studio drive.

# DM.02 Create the state schema and operations

Make extensive use of the Reactor MCP tools for this scenario DM.02. 
- Do not make any changes in the code yet!
- Do not create any files but always use the MCP tools for accessing documents.

Recall the best practices on how to create document model state schemas and operations.

## DM.02.1 Define the global state schema

### Reread the document description and come up with an extended version with more detail
  
  - Take the scope restrictions into account but don't include them in the extended description
  
  - Consider example data

  - Describe in more detail what the users can do with the data
    - Consider creation, modification, sorting/moving and removal of data objects
    - Consider actions with more advanced business logic
    - Consider workflow status transitions

  - Consider the relationship between the document you're creating and other document types
    - While documents must always be self-contained data structures, other documents can 
      be referenced with a `PHID` and, typically, a number of cached properties. 

### Example

If the original document description reads like this: 

```
The Pizza Plaza order document will be used by the restaurant owner, their customers and the kitchen chefs. 
The restaurant owner will prepare the document by defining the menu categories, options and prices in it. 
The customer will then use this menu to add the pizzas, sides and drinks they want to order to their basket. 
They will see the itemized prices and the total. Once the order is placed, a kitchen chef will check off the
items one by one as ready.

The order document does not support customization options for the items and it does not track the entire lifecycle
of payment, delivery, etc. It is meant to be a reliable reference for what the restaurant offers, what the customers 
wants, and what the kitchen has prepared.
```

An extended version can be this: 

```md
The Pizza Plaza order document will be used by the restaurant owner, their customers and the kitchen chefs. 
The restaurant owner will prepare the document by defining the menu categories, options and prices in it.

Example categories are 'Small Pizzas', 'Medium Pizzas', 'Large Pizzas', 'Sides', and 'Drinks'. The restaurant 
owner will define them simply with a label, and sort them in the right order. The category options are the actual 
products such as 'Peperoni Pizza', which should have a name, picture URL, short description sentence, and a 
unit price. The restaurant owner can create and edit the product details, and they can order the products within 
the category, and they can delete products.

The customer will then use this menu to add the pizzas, sides and drinks they want to order to their basket. They can 
update the amount and remove products from their basket. They cannot add the same product to their basket twice. They 
cannot change the order of the products in their basket. The products will simply appear in the same order as in the menu.

Customers will see the itemized prices and the total price of each basket line item. The restaurant owner will set a 
tax rate on each product category, which will also be applied. Overall we're keeping track of unit price excl. taxes, 
unit price incl. taxes, subtotal excl. taxes and subtotal incl. taxes, basket total excl. taxes, basket tax total per 
tax rate, and basket total incl. taxes. 

Customers can clear their entire basket and start over. They can add additional notes to the order, which they can do
to communicate for example allergies or delivery instructions.

**Workflow**

The document workflow enforces menu creation first, which is then locked down. As a second phase the customer will fill
their basket and confirm. Once confirmed, the basket can no longer be edited and the kitch chef will check off the items.
Once all items are checked off, the order document is fulfilled. It is possible to go back to menu editing but then the 
basket will be automatically cleared. There should be timestamps for each one of the status transitions.

**External documents**

The shop owner will reference a `pizza-plaza/point-of-sale` document in the `pizza-plaza/order` document, from where the
local name, company ID, address and telephone number will be cached.
```

### Extract an initial state schema from the extended description

  **State Schema Root Type on line 1**

  - **CRITICAL** On the very first line of the state schema, there is always a single root type called <DocumentModelName>State. 
    It is required to be the PascalCase version of the document name. Failing to apply this pattern will break the code generator later on.

    For example: if the document model name is `Pizza Plaza Order`, its root type name is `PizzaPlazaOrderState`

  - The root type must not have an ID field (OID or PHID), because the document header already contains an
    ID. However, it may contain a business logic code or reference that the user would use as document identifier.

    For example: Pizza Plaza needs an _order id_ for their accounting. This should be a `String` field or another
    appropriate scalar type, but not an `OID` or `PHID`, for example `orderRef: String`.

  **OIDs and PHIDs**

  - All objects in collections (arrays) MUST HAVE an `id: OID!`. `OID` fields are used both as "primary key" and 
    "foreign key reference". Good practice is to call the property `id` if it's a primary key, and call it 
    `otherObjectId: OID!` if it's a foreign key, with a comment to define which object types it can reference.

  - Use the `PHID` only to reference external documents if needed and identify the cached data properties 
    that are needed.
    
    "Cached data property" simply means that a number of properties will be set together with the 
    external document id so that the user can understand what was in the external document at the time when 
    the PHID field was set. These data properties can get out-of-date, so the system will need to ensure it's 
    updated when it matters.

    This is the same principle as the title and snippet information in HTML links and social media preview cards: 
    ```html
    <a href="http://example.com/document.html">
      <img src="..." alt="cached image"/>
      <p>Cached description that may be out-of-date</p>
    </a>
    ```

    Only use PHID fields when it's needed for the use case. Linking multiple documents always increases complexity.
  
  - **NEVER** use the `ID` type, which is a wider common practice in GraphQL. Instead use `OID` and `PHID`.

  - Always use `enum` types for workflow statuses.

  **When to use mandatory and optional state fields**

  Mandatory properties in a state and operation input schema are indicated with an exclamation mark, e.g. `id: OID!`. 

  Note that the reasoning about when to use mandatory fields in the state schema is quite different from the reasoning 
  about operation input schemas. We're only concerned with the former, in this section.

  - **IMPORTANT** A user must always be able to create an empty document _without_ providing any information, and the state
    schema needs to cover the entire life cycle of the document. This means that, in the root type, _properties can only be mandatory if they have a logical default value_!

    For example, one might think: "A Pizza Plaza order always needs an order ID for their accounting, make it mandatory", 
    but this overlooks the fact that the restaurant owner must be able to create an empty order document in the first place.
    Order ID in this case also does not have a logical default, because it has to be unique in the system. Therefore, 
    the `orderRef: String` field should definitely not be mandatory.

  - Collections, ie. array types, should always use double exclamation marks like `lines: [BasketLine!]!`. The inner 
    exclamation mark simply expresses that array items should never be a NULL value, which is always the case. The outer
    exclamation mark indicates that at least an empty array should always be set as value of the collection, as opposed to
    `lines = null`. Following our rule, this is almost always a very logical default.

  - Another situation with a common 'logical default' is in the case of a child objects. In our Pizza Plaza order example,
    the `menu: Menu!` should always _exist_, although it should be empty in the beginning. Note that this can only be done 
    if the child object also has a logical empty default -- mandatory properties of the child object may prevent us from 
    setting the 

    The customer basket, however, may logically only come into existence when the document moves on to the "BASKET_EDITING"
    phase. Therefore it could be made optional as a design decision to reflect the lifecycle business logic: `basket: Basket`

  **Images and attachments**

  There is no support for embedded images or attachments at the moment. Use the URL type to link images and attachments
  in the document model. 
  
  **Collection sorting**

  - There is no need to use a `position` or `weight` property to sort items in a collection. The items must be kept ordered
    in the array via their index. 

  - Since all collection objects have an `id: OID!`, moving and sorting operations can defined as
    `SORT(ids: [OID!]!, insertBefore: OID!)`. This is a best practice that creates operations that have good branching and
    merging behavior too. 

  **Trees and Recursion** 

  - Always define trees as a flat list, e.g. `TreeNodeType { id:OID!, parentId:OID }`, whereby root nodes have `parentId=null`

  - During reducer impelementation, it's good practice to have a sorting helper function that deterministically sorts the tree
    nodes, e.g. dept-first, and apply this helper function in every reducer that manipulates the tree structure.

### Example

The intial state schema could be like this:

```graphql

type PizzaPlazaOrderState {
  status: OrderStatus!          # default = MENU_EDITING
  pos: PointOfSaleInfo          # mandatory child properties make this optional
  menu: Menu!                   # default = empty menu
  basket: Basket                # does not exist until status = BASKET_EDITING
  customerNotes: String         # optional
  timestamps: OrderTimestamps!  # default = empty timestamps
}

enum OrderStatus {
  MENU_EDITING
  BASKET_EDITING
  BASKET_CONFIRMED
  ORDER_FULFILLED
}

type PointOfSaleInfo {
  docId: PHID!                  # references pizza-plaza/point-of-sale document
  name: String!                 # cached property
  companyID: String!            # cached property
  address: String               # cached property
  telephone: String             # cached property
}

type OrderTimestamps {
  menuCreatedAt: DateTime
  basketConfirmedAt: DateTime
  orderFulfilledAt: DateTime
}

type Menu {
  categories: [MenuCategory!]!
}

type MenuCategory {
  id: OID!
  label: String!
  taxRate: Float!
  items: [MenuItem!]!
}

type MenuItem {
  id: OID!
  status: MenuItemStatus!
  name: String!
  picture: URL
  description: String
  unitPriceInclTax: Float!
}

enum MenuItemStatus {
  DRAFT,
  AVAILABLE, 
  OUT_OF_STOCK
}

type Basket {
  lines: [BasketLine!]!
  totals: BasketTotals!
}

type BasketLine {
  id: OID!                  # Primary Key
  itemId: OID!              # Foreign Key: MenuItem.id
  quantity: Int!
  unitPriceExclTax: Float!
  unitPriceInclTax: Float!
  subtotalExclTax: Float!
  subtotalInclTax: Float!
  categoryTaxRate: Float!
  preparedByKitchen: Boolean!
}

type BasketTotals {
  totalExclTax: Float!
  taxBreakdown: [TaxRateTotal!]!
  totalInclTax: Float!
}

type TaxRateTotal {
  taxRate: Float!
  taxAmount: Float!
}
```

### Wrap-up

- Add the extended description to the WBS notes
- Ensure that the state schema is set in the document model spec using the Reactor MCP tools, for the `global` scope
- Verify the document is correctly updated

### Expected Outcome

The state schema of the document model is created following best-practice rules and written to the spec.

## DM.02.2 Generate a minimal default value for the document

Create a JSON object that complies to the root object type with only the mandatory properties filled.

### Example

Our empty `pizza-plaza/order` document would look as follows:

```json
{
  "status": "MENU_EDITING",
  "pos": null,
  "menu": {
    "categories": []
  },
  "basket": null,
  "customerNotes": null,
  "timestamps": {
    "menuCreatedAt": null,
    "basketConfirmedAt": null,
    "orderFulfilledAt": null
  }
}
```

### Wrap-up

- Prettify the JSON to improve readability

- Ensure that the default JSON is set in the document model spec for the `global` scope

- Verify the document is correctly updated using the Reactor MCP tools

### Expected Outcome

- The default value JSON is available in the document and complies to the state schema

## DM.02.3 Define the modules and operations titles

Keep the users of the new document model in mind and generate a list of operations grouped in modules.

### Example
```
Module 'menu_categories'
- ADD_CATEGORY(id:OID!, label:String!, taxRate:Float!)
- SET_CATEGORY_LABEL(id:OID!, label:String!)
- SET_CATEGORY_TAX_RATE(id:OID!, taxRate:Float!)
- REMOVE_CATEGORY(id:OID!)
- REORDER_CATEGORIES(orderedCategories:[OID!]!, insertBefore:OID)

Module 'menu_items'
- ADD_MENU_ITEM(categoryId:OID!, item:NewMenuItemInput!, insertBefore:OID)
- UPDATE_MENU_ITEM(id:OID!, item:MenuItemUpdateInput!)
- UPDATE_MENU_ITEM_STATUS(id:OID!, status:MenuItemStatus!)
- REMOVE_MENU_ITEM(id:OID!)
- REORDER_MENU_ITEMS(orderedMenuItems:[OID!]!, insertBefore:OID)

Module 'point_of_sale'
- SET_POINT_OF_SALE(docId:PHID!, name:String!, companyID:String!, address:String, telephone:String)
- UPDATE_POINT_OF_SALE_INFO(name:String, companyID:String, address:String, telephone:String)
- CLEAR_POINT_OF_SALE()

Module 'basket'
- ADD_LINE(id:OID!, menuItemId:OID!, quantity:Int)
- UPDATE_LINE_QTY(id:OID!, quantity:Int)
- REMOVE_LINE(id:OID!)

Module 'kitchen'
- MARK_ITEM_PREPARED(id:OID!)
- MARK_ITEM_TODO(id:OID!)

Module 'workflow'
- FINISH_MENU_EDITING(time:DateTime!)
- REOPEN_MENU_EDITING(time:DateTime!)
- CONFIRM_BASKET(time:DateTime!)
- MARK_ORDER_FULFILLED(time:DateTime!)
```

### Check consistency and correctness

- Remember that operation reducers are pure, deterministic functions
  - So we need to pass all OID values for new objects, for example: `ADD_CATEGORY` needs an `id:OID!` as input
  - And we need to pass all system-dependent data as input to avoid side effects, for example: `FINISH_MENU_EDITING` needs the `time`

- Users will have permissions on an operation level, so operations' responsibilities must be separated
  - For example: `MARK_ITEM_PREPARED` must be separated from `UPDATE_LINE_*`

- All state variables must be directly or indirectly controlled by the user
  - For example: `SET_CATEGORY_LABEL` is a straight-forward direct update
  - For example: `ADD_LINE`, `SET_CATEGORY_TAX_RATE`, ... sets the tax values/totals indirectly
  - For example: the workflow operations control the `status` field


### Update the document model specification using the Reactor MCP tools

- Always work in the document model's global scope
- Create all modules in the document
- Create all operations with their name and description

### Wrap-up

- Verify the document is correctly updated using the Reactor MCP tools

### Expected Outcome

- Document model operations and now listed in the document model spec in Vetra drive, grouped by module.
- Operation input types are still missing.

## DM.02.4 Define the operation inputs

Now add the input types to the document model using the Reactor MCP tools.
Take the rules below into account.

### CRITICAL: Input root type name

  - The input root type name must always be `<OperationName>Input` where `<OperationName>` is the pascal case version
    of the operation name. For example: the `SET_CATEGORY_LABEL` operation would have `SetCategoryLabelInput` as root 
    input type. 

  - Failing to apply this rule will break compilation later.

### CRITICAL: Getting type references right

- In the operation input schema, **ONLY** `enum` types (and scalars) from the state schema can be used. All other types
  are read model types and cannot be referenced as input types.

- Instead, consider creating additional input types to mirror the state schema types, but appreciate the differences,
  especially in the rules for mandatory properties. State schema enum types MUST NOT be redefined in the input types. 
  Doing so will result in compiler errors; they should just be used directly.

- Don't reuse the mirror input types either. Think of each input type as unique to its own operation.

### CRITICAL: Empty input type work-around

Due to a technical restriction, input types without any parameters are not supported at the moment by the code generator. 
A dummy optional property can be defined as a work-around.

For example, this will fail:

```gql
input ClearDescriptionInput {
}
```

Define an optional dummy parameter as work-around: 

```gql
input ClearDescriptionInput {
  _: Boolean
}
```

### Knowing when to use mandatory / optional input type properties

Input types are about _user intent and the mutation that will be applied_. As such, properties in input types should 
often be mandatory or optional, even if they are (not) optional in the state schema. Optional input properties that are 
set to null are either interpreted as "not included in the input" (add/patch-like operation) or could mean "clear this 
value in the state."

- Due to this ambiguity and also because clearing data often should have a separate permission associated, it's often
  advisable to create a separate `CLEAR_PROPERTY` operation. 

- For example: the `pizza-plaza/order` state schema has an optional `orderRef: String` state property because the order 
  reference won't be set when the empty document is first created. 

  - However, the `SET_ORDER_REF` operation's input type requires an orderRef parameter because, once set, the orderRef
    should generally not be cleared.

  - Should the requirement come up that an order ref, in fact, should be cleared in some cases, an additional 
    `CLEAR_ORDER_REF` operation should be added.

### Example 

If Pizza Plaza's state schema looks like this:

```graphql
type MenuCategory {
  id: OID!
  items: [MenuItem!]!
}

type MenuItem {
  id: OID!
  status: MenuItemStatus!
  name: String!
  picture: URL
}

enum MenuItemStatus {
  DRAFT,
  AVAILABLE, 
  OUT_OF_STOCK
}
```

We could have operations `ADD_CATEGORY_MENU_ITEMS`, `UPDATE_CATEGORY_MENU_ITEMS` and `CLEAR_MENU_ITEM_PICTURE` with input types: 

```graphql
"Operation: ADD_CATEGORY_MENU_ITEMS"
input AddCategoryMenuItemsInput {
  categoryId: OID!
  items: [NewMenuItemInput!]!   # we MUST NOT reference the MenuItem state type, instead we mirror with 
                                # a unique input type, NewMenuItemInput
}

input NewMenuItemInput {
  id: OID!                      # new item's OID, always required to keep the reducers pure

  status: MenuItemStatus        # enum state type _is_ available -- we can use it, MUST NOT redefine it
                                # default = AVAILABLE -- optional input, mandatory state value

  name: String!                 # no default, mandatory as the state value
  picture: URL                  # no default, optional as the state value
}

"Operation: UPDATE_CATEGORY_MENU_ITEMS"
input UpdateCategoryMenuItemsInput {
  categoryId: OID!
  items: [MenuItemUpdateInput!]! # we MUST NOT reference the MenuItem state type, or input type NewMenuItemInput 
                                 # instead we mirror with a unique input type, MenuItemUpdateInput
}

input MenuItemUpdateInput {
  id: OID!                      # existing item's OID
  status: MenuItemStatus        # enum state type _is_ available -- we can use it, MUST NOT redefine it
                                # default = no update
  name: String                  # default = no update
  picture: URL                  # default = no update
}

"Operation: CLEAR_MENU_ITEM_PICTURE"
input ClearMenuItemPictureInput {
  menuItemId: OID!
}
```

### Wrap-up

- Ensure that all modules, operations and their input types have been added to the document model spec via the Reactor MCP tools, for the `global` scope
- Verify the document is correctly updated
- In the project folder, verify that the code generator has been correctly triggered at this point

### Expected Outcome

- Document model operations and their input types are now available in the document model spec in Vetra drive.
- The TypeScript types and the reducers' boilerplate code are generated in the project folder.

# DM.03 Implement document model reducers

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
    
## DM.03.1 Confirm that the reducers boilerplate has been generated by Vetra

- Read the document model specifications in the Vetra drive for context

- In the `./src/document-models` folder, confirm you see the generated types and boilerplate code for reducers
    - Review their functionality
    - Identify reducers that are not yet implemented
    - Identify reducers that are incompletely implemented or need updates to conform with the specification document in Vetra drive

- Run `pnpm test` to know which tests are currently failing
- Run `pnpm build` to detect type errors

## DM.03.2 Implement and test the reducers one module at a time

Consider which order you will implement the operation modules in: 
    - Try to focus on the most complex modules first and verify the reducers' behavior
    - Save simple data setters until last unless they are a dependency

For each operations module with reducers that require work:
    1. Write the reducer implementation to the .ts file

       **IMPORTANT** Keep the reducers and their parameters strictly-typed. No `any` types are acceptable in 
       the reducers or their parameters, ever! Their business logic needs to be strict and well-tested, and 
       so should their type structure be.

    2. Design and write one or more unit tests to verify the expected behavior
       
       **IMPORTANT** Write a unit test for each reducer that does not use mock objects,
       and have the test check the expected document state after applying the operation(s)
       to verify the business logic.

    3. Rerun `pnpm test` and `pnpm build` until all issues are resolved
    4. Commit your changes once the module is completed

Do not proceed to the next reducers module until the last one is fixed

If you need to make changes in the document model specification in Vetra drive, always verify through the Reactor MCP tools 
that the changes have been correctly applied.

## DM.03.3 Provide a stakeholder update

- Verify that tests are passing via `pnpm test`
- Verify that no type errors remain with `pnpm build`
- Once all reducers are finished, provide an update to the stakeholder.
- If there are issues that you cannot resolve, make sure to inform the stakeholder

## Expected Skill Outcome

# Expected Skill Outcome

A new document model has been specified, implemented and tested. It is ready for use 
in a document editor component in Connect, or through a Switchboard API endpoint.
