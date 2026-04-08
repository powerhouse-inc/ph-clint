---
name: handle-stakeholder-message
description: "Triage stakeholder messages, update WBS documents, and draft replies"
metadata:
  author: Powerhouse
  version: "1.0.0"
---

=== BEGIN SKILL BRIEFING === 

# PREAMBLE

IMPORTANT:  Don't take any action yet. You will be guided through the tasks after 
            the briefing(s). Just process and confirm your understanding.

# Key Information

More specifically, you are about to be guided through the steps to process a new stakeholder message:

## Stakeholder 
The stakeholder that sent you a message
 - name: "{{stakeholder.name}}"

## Message Thread
The thread which contains the message
 - thread id: `{{thread.id}}`
 - topic: "{{thread.topic}}"

## Message
This is the message you need to reply to: 
 - message id: `{{message.id}}`

Content:
```message
{{message.content}}
```

# Notes

## Additional tools and context
 - Look inside your inbox to get the full context of the conversation.

 - Both your inbox and your WBS document are available in the manager drive
   and can be access with the agent-manager MCP tool

 - Whenever stakeholders refer to "your tasks", "on-going work", "current status", etc.,
   know that this implicitely applies to the goals in your WBS document, or smaller tasks
   associated with these goals.

## When and how to create new WBS goals
 
 - The WBS is a way to associate work requests with high-level goals, and break these down 
   into smaller goals (typically between 2 and 7 subgoals), all the way down to the level where 
   you can achieve the leaf goal by directly applying one of your MCP tools or skills.

 - DO NOT use WBS goals for small tasks that you can immediately take care of.

 - DO use WBS goals to capture big stakerholder requests for future reference and break them down
   into smaller subgoals to the point where you can easily achieve them. 

 - Use the self reflection MCP to learn more about the tools and skills you have available for resolving
   the WBS leaf goals. 

## Work documents
 - Agent manager drive ID: `{{documents.driveId}}`
 - Inbox document ID: `{{documents.inbox.id}}`
 - WBS document ID: `{{documents.wbs.id}}`

=== END OF SKILL BRIEFING ===

# HSM.00 Categorize the stakeholder message

## HSM.00.1 Read and understand the message and its context

- Use the agent manager tools to access the manager drive (ID: {{documents.driveId}})

- Open your inbox document (ID: {{documents.inbox.id}}) through the agent-manager tool and 
  locate the thread with id: {{thread.id}} about "{{thread.topic}}"

- Review the conversation history to understand the context

- Now consider the new message content and identify the main and any secondary intents

## HSM.00.2 Categorize the message type

Determine if the message is:
- **Information request**: The stakeholder is asking for information, status updates, clarification, or explanations
- **Planning request**: The stakeholder is asking you to make a plan for future work, which you will keep track of in your WBS document
- **Both**: The message contains both information requests and planning requests
- **Acknowledgment only**: The message is just confirming receipt or thanking you (no action needed)

## HSM.00.3 Clearly state the tasks derived from the stakeholder request

For information requests, rephrase the request and consider which tools to use, if any, to fullfil the request. 
For planning requests, clearly state the intended goal(s) the stakeholder is targetting.

# HSM.01 Review WBS based on stakeholder request

## HSM.01.1 Open and review your WBS document

1. Use the agent manager tools to access the manager drive (ID: {{documents.driveId}})
   and open your WBS document (ID: {{documents.wbs.id}})

2. Check if any existing goals relate to the stakeholder's message

3. **CRITICAL** First review your own capabilities through the self-reflection tool.

   Refamiliarize yourself with the skills, scenarios and tasks you are capable of.
   
   Then consider how the intended goals you derived from the stakeholder request, should be 
   broken down to the level of scenarios and tasks you identified in your capabilities. Breaking 
   down goals into tasks you're capable of is the essence of planning!

## HSM.01.2 Add a new goal (hierarchy) only if needed

Based on your message categorization from HSM.00:
- If the message is an **acknowledgment only**, no WBS update is needed
- If the message is an **information request**, no WBS update is needed
- If the message is a **planning request**, check if it's already covered by existing goals

If you decide an update is needed, use the agent manager tools to update your WBS document.

**Create a new WBS goal (hierarchy) only if needed**

**Ensure that new goal(s) are broken down in skills, scenarios and tasks you took from your self-reflected capability.**

For stakeholder planning requests that require one or more WBS goals:

- Lay out the goal hierarchy with an optional stakeholder request goal at the top level, then broken down in subgoals 
  following the (1) skills, (2) scenarios and (3) tasks from your capabilities.

  Consequently, the deepest tree you can build is 4 levels deep: 
  (1 Stakeholder Request Group) > (Skill(s)) > (Scenario(s)) > (Task(s))
  
  However, for simple requests always consider more shallow hierarchies, always with 1 root node: 
  - Just (1 Skill) > (Scenario(s)) > (Task(s))
  - Just (1 Scenario) > (Task(s))
  - Or just (1 Task)

  You are not required to include every scenario of a skill, or every task of a scenario.

  You can also match and mix:
  (1 Stakeholder Request Group)
    > (Scenario) > (Task(s))
    > (Task)
    > (Skill) > (Scenario(s)) > (Task(s))
    > (Another Task)

  However, keep in mind that following the standard scenarios gives the most reliable results. Mixing too much brings risks.

  **ALWAYS** break it down the level of tasks though! And remember that tasks are executed in order, depth-first.

- Always generate a unique id for new goals. This can be a `{short-slug}-{suffix}` for readability, e.g. 'mktplan.1.5-287af5'

- Include stakeholder, thread ID and message ID as a comment, at least in the top level goal(s) you create, so you can find the converation again later when you're executing the task.

- **CRITICAL:** When creating a goal based on your self-reflected capabilities, ALWAYS fill out the instructions.workType and 
  instructions.workId with the corresponding value of the capability. If you don't get this right, your task planner won't be 
  able to formulate the right tasks for you later. 

  - For leaf goals mapped to a capability task use, for example: 
    `{ workType: 'TASK', workId: 'DM.01.1', comment: 'Consider only two user categories, customer and shop owner, per stakeholder request.' }`

  - For parent goals mapped to a capability scenarion use, for example: 
    `{ workType: 'SCENARIO', workId: 'DM.01' }`

  - For parent goals mapped to a capability skills, use, for example: 
    `{ workType: 'SKILL', workId: 'DM' or 'document-modelling' }`

  The values 'DM.01.1', 'DM.01', 'DM' or 'document-modelling' in the examples **MUST** be identical to the capabilities IDs and the types must match.

- Do include any specific details that are relevent from the original conversation as comment or context on the instructions. Think of it as sending a message to your future self.

- It is not a problem to add duplicate capability skills, scenarios, and/or tasks to your work breakdown as goals, if steps or procedures should be repeated. You can mix and match as long as the goals have unique IDs, and they reference the capability's workType and workId correctly. Consequently, duplicate instruction workIds 
  are totally fine. Duplicate goal IDs are not!

- Create short goal titles inspired by the capability but applied to the topic of the request,

  - For example, `DM.01.1 Start by listing the users who will use the new document model` becomes: `DM.01.1 - List Pizza Order document users`
  - For example, `DM.00 Check Prerequisites` becomes: `DM.00 - Check prerequisites for Pizza Order reactor module`
  - For example, `DM document-modelling` becomes: `DM - Pizza Order document modelling`

  - Try to keep the title length below 50 chars

- Always add goals and potential subgoals under the appropriate parent goal in your WBS

- Set the initial status (typically TODO or IN PROGRESS)

- Add relevant details including:
  - Stakeholder name: {{stakeholder.name}}
  - Thread reference: Thread {{thread.id}}
  - Message reference: Message {{message.id}}
  - Expected deliverables
  - Any specific requirements mentioned

### Self-check

- Before finishing the planning, double-check that all leaf nodes are of workType: TASK and if not, break them down further.

## HSM.01.3 Update existing goals only if needed

Based on your planning work so far, consider if further updates to the WBS are needed.

- **CRITICAL** Ensure that the goals are in the right order. The task planner will pick up tasks in the order they're listed in the WBS.

- Update goal statuses where needed (e.g., unblock if waiting for information)

- Consider adding notes about the stakeholder's feedback or additional requirements. 
  Don't use the notes for planning. Goals should be in the goal hierarchy itself.

- Consider linking the message reference for traceability

**IMPORTANT** 

Verify that all goals are broken down the level of capability tasks. Goals matched to scenarios and skills
without child goals will not get picked up by your task planner!

Based on the message and your ability to proceed:
- **Todo**: Task is defined but not started
- **InProgress**: You can actively work on this task
- **Blocked**: You need clarification or are waiting for stakeholder input
- **Done**: Task is complete (if the message confirms completion)
- **WontDo**: Stakeholder asked to cancel the goal

# HSM.02 Send the reply through your inbox

## HSM.02.1 Mark the original message as read and reply

- Use the agent manager tools to mark the stakeholder's message {{message.id}} as read
- Use the agent manager tools to add your reply to the thread {{thread.id}}.
- Keep the reply message short: 1 sentence if it's appropriate. Up to 3 paragraphs if needed.
