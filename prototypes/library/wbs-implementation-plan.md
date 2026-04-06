# Work Breakdown Structure Implementation Plan

## Overview
This document outlines a methodical implementation plan for the WBS document model reducers. The implementation will proceed module by module, with careful verification at each step to ensure business logic correctness and maintain data invariants.

## Key Invariants to Maintain
1. **Status Consistency**: Goal status must be consistent with hierarchy (e.g., parent can't be TODO if child is IN_PROGRESS)
2. **No Circular Dependencies**: Goals cannot depend on themselves or their descendants
3. **No Circular Hierarchy**: Goals cannot be their own ancestors
4. **Delegation Rules**: Only leaf goals (no children) can be DELEGATED
5. **Assignee Consistency**: DELEGATED goals must have an assignee
6. **Status Transitions**: Only valid status transitions are allowed

## Implementation Order & Phases

### Phase 1: Workflow Module (Most Critical)
The workflow module is implemented first as it establishes the core business logic and status management.

#### 1.1 CREATE_GOAL Operation ✅
- [x] Implement basic goal creation with required fields
- [x] Handle optional fields (instructions, draft, metaData)
- [x] Set initial status (TODO or DELEGATED based on assignee)
- [x] Handle parent-child relationship setup
- [x] Implement insertion ordering (insertBefore logic)
- [x] Add initial note if provided
- [x] Set dependencies array
- [x] **Verify**: Goal appears in state.goals array
- [x] **Verify**: Status is TODO without assignee, DELEGATED with assignee
- [x] **Test**: Create root goal, child goal, goal with dependencies

#### 1.2 Status Transition Operations (Simple)
##### MARK_IN_PROGRESS ✅
- [x] Find target goal by ID
- [x] Update goal status to IN_PROGRESS
- [x] Add optional note if provided (skipped - needs ID generation)
- [x] Propagate IN_PROGRESS up to all ancestors
- [x] **Verify**: All ancestors are marked IN_PROGRESS
- [x] **Test**: Deep hierarchy propagation (6 tests passing)

##### MARK_COMPLETED ✅
- [x] Find target goal by ID  
- [x] Update goal status to COMPLETED
- [x] Add optional note if provided
- [x] Find all child goals (recursive)
- [x] Mark unfinished children as COMPLETED (skip COMPLETED/WONT_DO)
- [x] **Verify**: Entire subtree is completed correctly
- [x] **Test**: Mixed subtree with some already completed (6 tests passing)

##### MARK_TODO ✅
- [x] Find target goal by ID
- [x] Update goal status to TODO
- [x] Add optional note if provided
- [x] Find parent goals up the chain
- [x] Reset finished parents (COMPLETED/WONT_DO) to TODO
- [x] **Verify**: Parent chain consistency maintained
- [x] **Test**: Deep hierarchy with mixed statuses (5 tests passing)

##### MARK_WONT_DO ✅
- [x] Find target goal by ID
- [x] Update goal status to WONT_DO
- [x] Find all child goals (recursive)
- [x] Mark unfinished children as WONT_DO (skip COMPLETED/WONT_DO)
- [x] **Verify**: Subtree marked correctly
- [x] **Test**: Mixed subtree scenarios (4 tests passing)

#### 1.3 Delegation Operations
##### DELEGATE_GOAL ✅
- [x] Find target goal by ID
- [x] Validate goal has no children (leaf node only)
- [x] Update assignee field
- [x] Change status to DELEGATED
- [x] **Verify**: Only leaf goals can be delegated
- [x] **Test**: Attempt to delegate parent goal (should fail)
- [x] **Test**: 4 tests passing

##### REPORT_ON_GOAL ✅
- [x] Find target goal by ID
- [x] Validate goal status is DELEGATED
- [x] Add note to goal
- [x] If moveInReview is true, change status to IN_REVIEW
- [x] **Verify**: Only DELEGATED goals can be reported on
- [x] **Test**: Various status scenarios (4 tests passing)

#### 1.4 Blocking Operations ✅
##### REPORT_BLOCKED ✅
- [x] Find target goal by ID
- [x] Update goal status to BLOCKED
- [x] Store blocking question (added to notes with BLOCKED prefix)
- [x] Update global isBlocked if this is first blocked goal
- [x] **Verify**: Question is stored and retrievable
- [x] **Test**: Multiple blocked goals (3 tests passing)

##### UNBLOCK_GOAL ✅
- [x] Find target goal by ID
- [x] Validate goal status is BLOCKED
- [x] Store response (added to notes with UNBLOCKED prefix)
- [x] Change status back to TODO (since we don't track previous status)
- [x] Check if any goals remain blocked, update global isBlocked
- [x] **Verify**: Goal returns to correct status
- [x] **Test**: Last blocked goal updates global flag (4 tests passing)

### Phase 2: Hierarchy Module - REORDER Operation ✅
Critical for maintaining tree structure integrity.

#### 2.1 REORDER Implementation ✅
- [x] Find target goal by ID
- [x] Validate new parent is not a descendant (prevent cycles)
- [x] Remove goal from current position
- [x] Update parentId field
- [x] Insert at new position (handle insertBefore)
- [x] **Verify**: No circular references created
- [x] **Verify**: Goal maintains all its children
- [x] **Test**: Move to root, move to sibling, move to different branch
- [x] **Test**: Attempt circular reference (should fail)
- [x] **Test**: 6 tests passing

### Phase 3: Hierarchy Module - Dependencies ✅
Manage goal dependencies without creating cycles.

#### 3.1 ADD_DEPENDENCIES ✅
- [x] Find target goal by ID
- [x] Validate each dependency exists
- [x] Check no circular dependencies (goal can't depend on descendants)
- [x] Add new dependencies to existing array (avoid duplicates)
- [x] **Verify**: No circular dependency chains
- [x] **Test**: Valid and invalid dependency scenarios (5 tests passing)

#### 3.2 REMOVE_DEPENDENCIES ✅
- [x] Find target goal by ID
- [x] Filter out specified dependencies from array
- [x] **Verify**: Dependencies removed correctly
- [x] **Test**: Remove some, remove all (4 tests passing)

### Phase 4: Documentation Module ✅
Simpler operations for managing goal content.

#### 4.1 Content Updates ✅
- [x] UPDATE_DESCRIPTION: Update description field
- [x] UPDATE_INSTRUCTIONS: Update instructions field
- [x] CLEAR_INSTRUCTIONS: Set instructions to null
- [x] **Verify**: Fields update correctly (3 tests passing)

#### 4.2 Note Management ✅
- [x] ADD_NOTE: Create note object, add to notes array
- [x] REMOVE_NOTE: Find and remove note by ID
- [x] CLEAR_NOTES: Empty the notes array
- [x] **Verify**: Note operations maintain data integrity (6 tests passing)

#### 4.3 Draft Status ✅
- [x] MARK_AS_DRAFT: Set isDraft to true
- [x] MARK_AS_READY: Set isDraft to false
- [x] **Verify**: Draft flag toggles correctly (2 tests passing)

### Phase 5: Metadata Module ✅
Global WBS metadata operations.

#### 5.1 SET_REFERENCES ✅
- [x] Update state.references array
- [x] **Verify**: References stored at WBS level (3 tests passing)

#### 5.2 SET_META_DATA ✅
- [x] Create/update state.metaData object
- [x] Set format and data fields
- [x] **Verify**: Metadata structure maintained (4 tests passing)

## Testing Strategy

### Unit Tests for Each Operation
1. Test happy path
2. Test edge cases
3. Test validation/error conditions
4. Test with empty state
5. Test with complex existing state

### Integration Tests
1. Create complex WBS hierarchy
2. Test status propagation across operations
3. Test dependency chains
4. Test delegation workflow
5. Test blocking/unblocking workflow

### Invariant Tests
After each operation, verify:
1. No circular hierarchies
2. No circular dependencies  
3. Status consistency maintained
4. Delegation rules followed
5. Global isBlocked flag accurate

## Helper Functions Needed

```typescript
// Utility functions to implement
function findGoal(goals: Goal[], id: string): Goal | undefined
function findGoalIndex(goals: Goal[], id: string): number
function getChildren(goals: Goal[], parentId: string): Goal[]
function getDescendants(goals: Goal[], id: string): Goal[]
function getAncestors(goals: Goal[], id: string): Goal[]
function isDescendant(goals: Goal[], ancestorId: string, descendantId: string): boolean
function hasBlockedGoals(goals: Goal[]): boolean
function isLeafGoal(goals: Goal[], id: string): boolean
```

## Implementation Progress Tracking

### Module Completion
- [x] Workflow Module (9/9 operations) ✅
- [x] Hierarchy Module (3/3 operations) ✅
- [x] Documentation Module (8/8 operations) ✅
- [x] Metadata Module (2/2 operations) ✅

### Test Coverage
- [x] Unit tests written (91 tests total)
- [x] All operations have comprehensive tests
- [x] All invariants verified

### Definition of Done
- Implementation is finished
- All unit tests are passing when running `pnpm test` and they cover the new functionality
- TypeScript compiles without typing errors
- Linting rules are applied and passing
- `pnpm build` shows no issues
- Planning document is updated with the latest status

### Comitting work
Work will be committed for every step when the definition of done is satisfied before proceeding to the next step implementation.
Separate the `git add` and `git commit` commands to work independently without required user confirmation.

## Notes & Considerations

1. **Status History**: Consider tracking previous status for unblocking
2. **Note IDs**: Ensure unique IDs for notes
3. **Performance**: Consider indexing goals by ID for large hierarchies
4. **Validation**: Add comprehensive validation before state mutations
5. **Error Handling**: Graceful handling of missing goals, invalid states

## Success Criteria

1. All 22 operations implemented
2. All tests passing
3. No invariant violations possible
4. Clean, maintainable code
5. Comprehensive error handling
6. Performance acceptable for large hierarchies (1000+ goals)