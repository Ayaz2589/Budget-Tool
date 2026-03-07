---
name: pr-context
description: Get full PR context (description, status, diff, commits) for a given PR number.
---

## Input

The PR number is: `$ARGUMENTS`

If no PR number was provided, ask the user for one before proceeding.

## Instructions

Gather the full PR context for the given PR using the `gh` CLI. Execute the following steps:

### 1. Fetch PR metadata

Run `gh pr view $ARGUMENTS --json number,title,state,author,labels,createdAt,updatedAt,url,headRefName,baseRefName,reviewRequests,additions,deletions,changedFiles` to get the PR details.

If the PR is not found, tell the user and stop.

### 2. Fetch PR body

Run `gh pr view $ARGUMENTS --json body` to get the full PR description.

### 3. Fetch PR diff

Run `gh pr diff $ARGUMENTS` to get the code changes.

### 4. Fetch commit history

Run `gh pr view $ARGUMENTS --json commits` to get the list of commits on the branch.

### 5. Extract linked issue keys

Scan the PR title and body for Jira/Linear keys matching patterns like `[EN-*]`, `[CS-*]`, `[CT-*]`, `EN-\d+`, `CS-\d+`, `CT-\d+`, or `AYA-\d+`.

### 6. Present the context

Output a structured summary in this format:

```
## PR #<number>: <title>
**URL:** <url>
**State:** <state> | **Author:** <author> | **Branch:** <head> → <base>
**Created:** <date> | **Updated:** <date>
**Changes:** +<additions> -<deletions> across <changedFiles> files
**Labels:** <labels or "none">
**Reviewers:** <reviewers or "none">
**Linked Issues:** <extracted keys or "none">

### Description
<PR body>

### Commits
<list of commits with hash and message>

### Diff
<full diff output>
```
