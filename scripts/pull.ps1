# Get the current branch name
$currentBranch = git rev-parse --abbrev-ref HEAD

# Pull the latest changes from the current branch
git pull origin $currentBranch --rebase --autostash

# Check if package.json was updated in the last pull
if (git diff --name-only "HEAD@{1}" HEAD | Select-String 'package.json') {
    # Install dependencies if package.json was updated
    bun install
}

# Run migrations
bun run migrate
