#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get repository info from package.json
REPO_URL=$(node -p "require('./package.json').repository" 2>/dev/null || echo "")
if [ -z "$REPO_URL" ]; then
  echo -e "${RED}Error: Could not find repository URL in package.json${NC}"
  exit 1
fi

# Extract owner and repo name from URL
# Handle both https://github.com/owner/repo.git and git@github.com:owner/repo.git formats
REPO_PATH=$(echo "$REPO_URL" | sed -E 's#^https://github.com/##; s#^git@github.com:##; s#\.git$##')
OWNER=$(echo "$REPO_PATH" | cut -d'/' -f1)
REPO=$(echo "$REPO_PATH" | cut -d'/' -f2)

echo -e "${GREEN}Repository: $OWNER/$REPO${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
  echo "Install it from: https://cli.github.com/"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo -e "${YELLOW}Not authenticated with GitHub CLI. Running gh auth login...${NC}"
  gh auth login
fi

# Generate SSH key
KEY_DIR="$HOME/.ssh/github-repository-write-deploy-keys"
mkdir -p "$KEY_DIR"
KEY_NAME="${OWNER}_${REPO}_$(date +%s)"
KEY_PATH="$KEY_DIR/$KEY_NAME"
echo -e "${GREEN}Generating SSH key pair...${NC}"
ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "deploy-key-$OWNER-$REPO"

PUBLIC_KEY=$(cat "${KEY_PATH}.pub")
PRIVATE_KEY=$(cat "$KEY_PATH")

echo -e "${GREEN}SSH key generated at: $KEY_PATH${NC}"

# Add deploy key to GitHub with write access
echo -e "${GREEN}Adding deploy key to GitHub repository...${NC}"
DEPLOY_KEY_RESULT=$(gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/$OWNER/$REPO/keys" \
  -f title="Push Github Actions Key - $(date '+%Y-%m-%d %H:%M:%S')" \
  -f key="$PUBLIC_KEY" \
  -F read_only=false)

echo -e "${GREEN}Deploy key added successfully${NC}"

# Set private key as GitHub Actions secret
SECRET_NAME="PUSH_DEPLOY_KEY"
echo -e "${GREEN}Setting private key as GitHub Actions secret: $SECRET_NAME${NC}"
echo "$PRIVATE_KEY" | gh secret set "$SECRET_NAME" --repo "$OWNER/$REPO"

echo -e "${GREEN}Secret '$SECRET_NAME' set successfully${NC}"

echo -e "${GREEN}Key files saved in: $KEY_DIR${NC}"
echo -e "${YELLOW}Private key: $KEY_PATH${NC}"
echo -e "${YELLOW}Public key: ${KEY_PATH}.pub${NC}"

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Deploy key added to: https://github.com/$OWNER/$REPO/settings/keys"
echo "Secret added as: $SECRET_NAME"
