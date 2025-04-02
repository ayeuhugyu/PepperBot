#!/bin/bash

# Update package list and install prerequisites
echo "Updating package list and installing prerequisites..."
sudo apt update
sudo apt install -y python3 python3-pip git

# Install yt-dlp
echo "Installing yt-dlp..."
pip3 install --upgrade yt-dlp

# Clone and install lune-org/lune
echo "Cloning and installing lune-org/lune..."
git clone https://github.com/lune-org/lune.git
cd lune
./install.sh
cd ..

# Cleanup
echo "Cleaning up..."
rm -rf lune

echo "Installation complete!"