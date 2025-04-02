#!/bin/bash

# Get the current branch name
current_branch=$(git rev-parse --abbrev-ref HEAD)

# Pull the latest changes from the current branch
git pull origin "$current_branch"

# Check if package.json was updated in the last pull
if git diff --name-only HEAD@{1} HEAD | grep -q 'package.json'; then
    # Install dependencies if package.json was updated
    bun install
fi

# Run migrations
bun run migrate
