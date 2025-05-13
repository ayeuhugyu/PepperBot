#!/bin/bash
set -e

# Detect OS
if [[ "$OS" == "Windows_NT" ]] || grep -qi microsoft /proc/version 2>/dev/null; then
    # Windows (WSL or native)
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    bun setup || true
else
    # Linux/macOS
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    bun setup || true
fi