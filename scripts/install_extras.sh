#!/bin/bash

# Update package list and install prerequisites
echo "Updating package list and installing prerequisites..."
sudo apt update
sudo apt install -y python3 python3-pip git

# Install yt-dlp
echo "Installing yt-dlp..."
pip3 install --upgrade yt-dlp

# Install lune using apt
echo "Installing lune using apt..."
if sudo apt install -y lune; then
    echo "Lune installed successfully using apt."
else
    echo "Failed to install lune using apt. Please check if the package is available or install it manually."
    lune_install_failed=true
fi

# Cleanup
echo "Cleaning up..."
rm -rf lune

# Warning if lune installation failed
if [ "$lune_install_failed" = true ]; then
    echo -e "\e[33mWARNING: Lune installation failed. Please manually install it via the instructions at https://lune-org.github.io/docs/getting-started/1-installation\e[0m"
fi

echo "Installation complete!"