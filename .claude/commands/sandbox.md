---
name: sandbox
description: Generate a Docker sandbox environment for autonomous Claude Code runs. Reads ARCHITECTURE.md to determine the tech stack and services needed.
---

## Input

Arguments: `$ARGUMENTS`

- If a project path is provided (e.g., `/sandbox storefront_v2`), use that project's ARCHITECTURE.md.
- If empty, use the current working directory.

## Instructions

Generate a Docker-based sandbox environment where Claude Code can run autonomously with `--dangerously-skip-permissions`.

### 1. Read project context

Look for `ARCHITECTURE.md` in the target project directory.

**If it does NOT exist:** Tell the user: "No ARCHITECTURE.md found. Run `/audit` first to generate one." Then stop.

**If it exists:** Read it and extract:
- **Language & runtime** (e.g., Python 3.12, Node.js 20)
- **Framework** (e.g., Next.js 15, FastAPI)
- **Package manager** (e.g., npm, poetry, pnpm, yarn, bun)
- **External services** (e.g., PostgreSQL, Redis, Elasticsearch) — from System Overview diagram and Configuration section
- **Environment variables** — from Configuration section
- **Test command** — from CLAUDE.md if it exists
- **Build command** — from CLAUDE.md if it exists

Also read `CLAUDE.md` if it exists for commands and constraints.

### 2. Determine base image

Map the runtime to a Docker base image:

| Runtime | Base Image |
|---|---|
| Node.js 18 | `node:18-bookworm` |
| Node.js 20 | `node:20-bookworm` |
| Node.js 22 | `node:22-bookworm` |
| Python 3.11 | `python:3.11-bookworm` |
| Python 3.12 | `python:3.12-bookworm` |
| Python + Node (full-stack) | `node:20-bookworm` + install python3 |

If the project uses multiple runtimes, pick the primary one and install the secondary.

### 3. Determine required services

From the ARCHITECTURE.md System Overview and Configuration sections, identify external services:

| Service | Docker Image | Default Port |
|---|---|---|
| PostgreSQL | `postgres:16` | 5432 |
| Redis | `redis:7-alpine` | 6379 |
| Elasticsearch | `elasticsearch:8.11.1` | 9200 |
| MySQL | `mysql:8` | 3306 |
| MongoDB | `mongo:7` | 27017 |

### 4. Generate sandbox files

Create a `.claude-sandbox/` directory in the project root with:

#### `Dockerfile`

```dockerfile
FROM <base-image>

# System dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    jq \
    <additional-system-deps> \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI
RUN npm i -g @anthropic-ai/claude-code

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh && rm -rf /var/lib/apt/lists/*

# Install package manager if not included in base
# e.g., poetry, pnpm, yarn, bun

# Git config for sandbox commits
RUN git config --global user.name "Claude Code (Sandbox)" \
    && git config --global user.email "claude-sandbox@noreply.github.com"

WORKDIR /workspace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

Adapt the Dockerfile based on what was discovered:
- Add `python3`, `pip` if a Python project on a Node base (or vice versa)
- Add `poetry` install if poetry is the package manager
- Add any system libraries needed (e.g., `libffi-dev`, `gcc` for Python C extensions)

#### `entrypoint.sh`

```bash
#!/bin/bash
set -e

cd /workspace

# Install project dependencies
<package-install-command>  # e.g., npm install, poetry install

# Wait for services if needed
<wait-for-db-logic>  # e.g., wait for PostgreSQL to be ready

# Run Claude Code autonomously
# TASK is passed as an environment variable or command argument
if [ -n "$TASK" ]; then
    claude --dangerously-skip-permissions --print "$TASK"
elif [ -n "$1" ]; then
    claude --dangerously-skip-permissions --print "$@"
else
    # Interactive mode
    claude --dangerously-skip-permissions
fi
```

#### `docker-compose.yml` (only if external services are needed)

```yaml
services:
  sandbox:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ..:/workspace
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GH_TOKEN=${GH_TOKEN}
      <env-vars-from-architecture>
    depends_on:
      <services>:
        condition: service_healthy
    stdin_open: true
    tty: true

  <service-definitions>
```

If no external services are needed, generate a simpler `run.sh` instead:

#### `run.sh` (no-services alternative)

```bash
#!/bin/bash
# Run Claude Code in a sandbox container
#
# Usage:
#   ./run.sh                          # Interactive mode
#   ./run.sh "implement feature X"    # Autonomous mode with task

docker build -t claude-sandbox -f .claude-sandbox/Dockerfile .claude-sandbox/
docker run -it --rm \
    -v "$(cd .. && pwd)":/workspace \
    -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
    -e GH_TOKEN="$GH_TOKEN" \
    claude-sandbox "$@"
```

### 5. Generate `.env.example`

Create `.claude-sandbox/.env.example` listing all required environment variables:

```
# Required
ANTHROPIC_API_KEY=your-api-key-here

# GitHub (for pushing branches and creating PRs)
GH_TOKEN=your-github-token-here

# Project-specific (from ARCHITECTURE.md Configuration section)
<env-vars>=<example-values>
```

### 6. Report

Output a summary:

```
## Sandbox Generated

**Location:** .claude-sandbox/
**Base image:** <image>
**Services:** <list or "none">
**Files created:**
- Dockerfile
- entrypoint.sh
- docker-compose.yml (or run.sh)
- .env.example

### Quick Start

1. Copy `.claude-sandbox/.env.example` to `.claude-sandbox/.env` and fill in your keys
2. Run:
   ```bash
   # With services (docker-compose)
   cd .claude-sandbox && docker compose run sandbox "implement feature X"

   # Without services (run.sh)
   .claude-sandbox/run.sh "implement feature X"

   # Interactive mode
   .claude-sandbox/run.sh
   ```

### Notes
- The workspace is mounted as a volume — changes persist to your local repo
- Claude runs on a branch and commits as it goes
- Review the branch and create a PR when satisfied
```
