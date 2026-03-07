---
name: create-pr
description: Create a GitHub pull request with assignee and label selection. Saves preferences on first run.
---

## Instructions

Create a GitHub pull request for the current branch using the `gh` CLI. Follow these steps in order:

### 0. Load or initialize config

Check if `.claude/pr-config.md` exists in the project root.

**If it exists:** Read it and extract saved values (GitHub username, display name, default base branch, favorite labels).

**If it does NOT exist:** Run first-time setup:

1. Get the authenticated GitHub user:
   ```bash
   gh api user --jq '{login: .login, name: .name}'
   ```

2. Detect the default base branch:
   ```bash
   gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
   ```

3. Fetch available labels:
   ```bash
   gh label list --json name --jq '.[].name' --limit 50
   ```

4. Ask the user which labels they commonly use (they can pick multiple or none).

5. Save the config to `.claude/pr-config.md`:
   ```markdown
   # PR Config
   
   ## GitHub User
   - Username: <login>
   - Display Name: <name>
   
   ## Defaults
   - Base Branch: <branch>
   - Favorite Labels: <comma-separated list or "none">
   ```

Proceed with the saved/discovered values.

### 1. Validate branch state

Run `git status` and `git log --oneline <base-branch>..HEAD` to confirm:
- You are NOT on the base branch
- There are commits to include in the PR

If on the base branch or no commits, tell the user and stop.

### 2. Check remote tracking

Run `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` to check if the branch tracks a remote.

If not tracking, push with: `git push -u origin HEAD`

If tracking, check if up to date: `git status -sb`. Push if behind.

### 3. Gather PR details

Use AskUserQuestion to ask the user the following (all in one question block):

**Title:** Ask for the PR title. Suggest a default based on the branch name and commit messages.

**Assignee:** Ask who to assign. Options:
- `<saved display name>` (Recommended — uses saved GitHub username)
- Other (search by username)
- Unassigned

**Labels:** Present the saved favorite labels as recommended options. Also offer:
- Other (pick from all repo labels)
- None

### 4. Build PR body

Analyze all commits on the branch (`git log --oneline <base-branch>..HEAD`) and the diff (`git diff <base-branch>...HEAD --stat`) to generate the PR body.

Use this format:

```
## Summary
<2-4 bullet points describing the changes>

## Test plan
<checklist of testing steps>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### 5. Create the PR

Run `gh pr create` with:
- `--title` from user input
- `--body` using a HEREDOC for correct formatting
- `--assignee` GitHub username (from config or user selection)
- `--label` for each selected label (comma-separated)
- `--base <base-branch>` from config

If a selected label doesn't exist in the repo, create it first:
```bash
gh label create "<label>" --color "1d76db"
```

### 6. Confirm

Output the PR URL to the user when done.
