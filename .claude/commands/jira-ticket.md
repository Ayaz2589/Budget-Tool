---
description: Create a Jira ticket with project selection, assignee, labels, status, and optional PR linking. Saves preferences on first run.
---

## Input

Arguments: `$ARGUMENTS`

The arguments may contain the ticket summary/title. If empty, ask the user for a summary.

## Instructions

Create a Jira ticket using the Jira MCP tools. Follow these steps in order.

### 0. Load or initialize config

Check if `.claude/jira-config.md` exists in the project root.

**If it exists:** Read it and extract saved values (Jira site, account ID, display name, default project, favorite projects, issue types, statuses).

**If it does NOT exist:** Run first-time setup after verifying the connection in step 1:

1. Get the user's Jira identity from step 1 results.

2. Ask the user to provide their **Jira site name** (the subdomain in `<site>.atlassian.net`).

3. Discover available projects:
   ```
   jira_get path: /rest/api/3/project
   jq: "[*].{key: key, name: name}"
   ```

4. Ask the user which projects they commonly use (pick up to 5) and which is the default.

5. For each selected project, fetch available issue types:
   ```
   jira_get path: /rest/api/3/project/<PROJECT_KEY>
   jq: "{issueTypes: issueTypes[*].{name: name}}"
   ```

6. Save the config to `.claude/jira-config.md`:
   ```markdown
   # Jira Config

   ## User
   - Site: <site-name>
   - Account ID: <accountId>
   - Display Name: <displayName>
   - Email: <email>

   ## Default Project
   - Key: <PROJECT_KEY>
   - Name: <project name>

   ## Projects
   | Key | Name | Issue Types |
   |-----|------|-------------|
   | XX  | Name | Task, Bug, Epic, Story |

   ## Defaults
   - Issue Type: Task
   - Status: To Do
   ```

Proceed with saved/discovered values.

### 1. Verify Jira connection

Test the connection by running the `jira_get` MCP tool:
```
path: /rest/api/3/myself
jq: "{displayName: displayName, emailAddress: emailAddress, accountId: accountId}"
```

If this fails, the Jira MCP server is not configured. Help the user set it up:
1. Tell them they need a Jira API token from https://id.atlassian.com/manage-profile/security/api-tokens
2. The `.mcp.json` file needs a `jira` entry with:
   - `ATLASSIAN_SITE_NAME`: their Jira subdomain
   - `ATLASSIAN_USER_EMAIL`: their Jira email
   - `ATLASSIAN_API_TOKEN`: their API token
3. After updating `.mcp.json`, they need to restart Claude Code for the MCP server to connect.
4. Stop here until the connection works.

### 2. Gather ticket details

Use the AskUserQuestion tool to collect the following in a single prompt:

**Question 1 — Project:**
Present the saved projects from config with the default marked as recommended. If user picks one not in the list, search for it.

**Question 2 — Issue Type:**
Present available issue types for the selected project (from config). Default to the saved default type.

**Question 3 — Status:**
Ask what initial status to set:
- `To Do` (Recommended)
- `In Progress`
- `Backlog`
- `Draft`

**Question 4 — Assignee:**
If a default assignee exists in config, ask if they want to use it or pick someone else:
- `Use default: <name>` (Recommended)
- `Choose someone else`
- `Unassigned`

### 3. Get description

Ask the user for the ticket description. If the arguments already contain enough context for both a summary and description, use that. Format the description as a clear list of requirements or acceptance criteria.

### 4. Look up assignee

If the user chose to use the default, use the saved account ID from config.

If the user chose "Choose someone else", search for users:
```
jira_get path: /rest/api/3/user/search
queryParams: { "query": "<search term>" }
jq: "[*].{accountId: accountId, displayName: displayName, emailAddress: emailAddress}"
```
Present the results and let the user pick.

### 5. Fetch labels

Get available labels:
```
jira_get path: /rest/api/3/label
queryParams: { "maxResults": "50" }
```

Ask the user which label(s) to apply, or none.

### 6. Check for existing PR

Check if there's a PR on the current git branch:
```bash
gh pr view --json url,title,number 2>/dev/null
```

If a PR exists, include the PR URL in the ticket description.

### 7. Create the ticket

Use the `jira_post` MCP tool to create the issue:
```
path: /rest/api/3/issue
body: {
  "fields": {
    "project": { "key": "<PROJECT_KEY>" },
    "summary": "<summary>",
    "issuetype": { "name": "<type>" },
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "<description>" }]
        }
      ]
    },
    "assignee": { "accountId": "<accountId>" },
    "labels": ["<label1>", "<label2>"]
  }
}
jq: "{key: key, id: id, self: self}"
```

Notes:
- Omit `assignee` field entirely if "Unassigned" was chosen.
- Omit `labels` field if no labels were selected.
- If there's a PR, append a line to the description: "GitHub PR: <url>"

### 8. Transition status

If the user chose a status other than the default (usually "To Do"), transition the ticket.

First, get available transitions:
```
jira_get path: /rest/api/3/issue/<ISSUE_KEY>/transitions
jq: "transitions[*].{id: id, name: name}"
```

Then post the transition:
```
jira_post path: /rest/api/3/issue/<ISSUE_KEY>/transitions
body: { "transition": { "id": "<transition_id>" } }
```

### 9. Report

Output the created ticket:

```
## Ticket Created

**Key:** <ISSUE_KEY>
**URL:** https://<site>.atlassian.net/browse/<ISSUE_KEY>
**Project:** <project name>
**Type:** <issue type>
**Summary:** <summary>
**Status:** <status>
**Assignee:** <name or "Unassigned">
**Labels:** <labels or "none">
**PR:** <PR URL or "none">
```
