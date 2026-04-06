# New Chat Thread Popover Implementation Plan

## Requirements
Create a popover modal with semitransparent black background that allows users to:
1. Manage stakeholders (add, edit, remove)
2. Select a stakeholder for the new chat
3. Enter a topic for the conversation
4. Write an initial message
5. Create the new chat thread

## Design Overview

### Visual Design
- **Backdrop**: Semitransparent black overlay (rgba(0,0,0,0.5))
- **Modal**: White rounded container, centered on screen
- **Two-step flow** within the same modal:
  - Step 1: Stakeholder management and selection
  - Step 2: Topic and initial message input

### User Flow
1. User clicks "New Chat" button
2. Modal opens showing existing stakeholders
3. User can:
   - Select an existing stakeholder
   - Add a new stakeholder (inline form)
   - Edit existing stakeholder details (inline editing)
   - Remove stakeholders (soft delete)
4. After selecting a stakeholder, the view transitions to:
   - Topic input field
   - Initial message textarea
5. User clicks "Create new chat" to confirm
6. Modal closes and new thread is created and selected

## Implementation Steps

### 1. Create NewChatModal Component
- [x] Create `/editors/agent-inbox-editor/components/NewChatModal.tsx`
- [x] Implement backdrop with click-outside-to-close
- [x] Add escape key handler to close modal
- [x] Implement two-step view management

### 2. Stakeholder Management View
- [x] List existing stakeholders with avatars
- [x] Add "Add Stakeholder" button with inline form
- [x] Implement inline editing for stakeholder details
- [x] Add remove button for each stakeholder
- [x] Highlight selected stakeholder
- [x] Add search/filter for stakeholders list

### 3. Chat Creation View
- [x] Topic input field (optional)
- [x] Initial message textarea (required)
- [x] Back button to return to stakeholder selection
- [x] Create button with validation

### 4. Wire Up Actions
- [x] Connect ADD_STAKEHOLDER action
- [x] Connect SET_STAKEHOLDER_NAME action
- [x] Connect SET_STAKEHOLDER_ADDRESS action
- [x] Connect SET_STAKEHOLDER_AVATAR action
- [x] Connect REMOVE_STAKEHOLDER action
- [x] Connect CREATE_THREAD action

### 5. Integration
- [x] Update AgentPanel to trigger modal on "New Chat" click
- [x] Handle modal state in parent component
- [x] Auto-select newly created thread
- [x] Handle loading states during creation

## Component Structure

```
NewChatModal
├── Backdrop (click to close)
├── Modal Container
│   ├── Header (title + close button)
│   ├── Content
│   │   ├── StakeholderView (when no stakeholder selected)
│   │   │   ├── Search Bar
│   │   │   ├── Stakeholder List
│   │   │   │   ├── Stakeholder Item
│   │   │   │   │   ├── Avatar
│   │   │   │   │   ├── Name (editable)
│   │   │   │   │   ├── Address (editable)
│   │   │   │   │   └── Actions (edit/remove)
│   │   │   │   └── Add Stakeholder Form
│   │   │   └── Continue Button
│   │   └── ChatCreationView (when stakeholder selected)
│   │       ├── Selected Stakeholder Display
│   │       ├── Topic Input
│   │       ├── Message Textarea
│   │       └── Action Buttons (Back/Create)
│   └── Footer (optional status/help text)
```

## Technical Considerations

### State Management
- Modal open/closed state
- Current view (stakeholder selection vs chat creation)
- Selected stakeholder ID
- Form validation state
- Loading state during operations

### Validation Rules
- Stakeholder must have a name
- Initial message is required
- Topic is optional
- Prevent duplicate stakeholder names

### Accessibility
- Focus management (trap focus in modal)
- Keyboard navigation support
- ARIA labels and roles
- Proper heading hierarchy

### Error Handling
- Display errors for failed operations
- Validate before submission
- Handle network/dispatch errors gracefully

## Success Criteria
- [ ] Modal opens/closes smoothly with animation
- [ ] All stakeholder CRUD operations work
- [ ] Thread creation dispatches correct actions
- [ ] New thread is automatically selected after creation
- [ ] Modal is fully keyboard accessible
- [ ] Responsive design works on smaller screens