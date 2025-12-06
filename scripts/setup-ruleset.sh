#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Parse arguments
RULESET_NAME="Default branch"
DRY_RUN=false
UPDATE_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --update-only) UPDATE_ONLY=true ;;
    --*)
      # Skip other flags
      ;;
    *)
      # First non-flag argument is the ruleset name
      if [ "$RULESET_NAME" = "Default branch" ]; then
        RULESET_NAME="$arg"
      fi
      ;;
  esac
done

echo -e "${BLUE}Setting up ruleset: '$RULESET_NAME'${NC}"
echo -e "${BLUE}Repository: $OWNER/$REPO${NC}"
[ "$DRY_RUN" = true ] && echo -e "${YELLOW}DRY RUN MODE${NC}"
[ "$UPDATE_ONLY" = true ] && echo -e "${YELLOW}UPDATE ONLY MODE${NC}"

# Function to create/update ruleset
setup_ruleset() {
  local ruleset_name=$1
  local json_file="/tmp/ruleset_${ruleset_name}.json"

  # Create ruleset JSON configuration
  cat > "$json_file" << 'EOF'
{
  "name": "RULESET_NAME_PLACEHOLDER",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "required_linear_history"
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          {
            "context": "reviewflow",
            "integration_id": 10678
          }
        ]
      }
    }
  ],
  "bypass_actors": [
    {
      "actor_type": "DeployKey",
      "bypass_mode": "exempt"
    },
    {
      "actor_type": "RepositoryRole",
      "actor_id": 5,
      "bypass_mode": "always"
    }
  ]
}
EOF

  # Replace placeholders
  sed -i '' "s/RULESET_NAME_PLACEHOLDER/$ruleset_name/g" "$json_file"

  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY RUN - Ruleset configuration:${NC}"
    cat "$json_file"
    rm "$json_file"
    return
  fi

  # Check if ruleset already exists
  EXISTING_RULESET=$(gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$OWNER/$REPO/rulesets" \
    --jq ".rulesets[] | select(.name == \"$ruleset_name\") | .id" \
    2>/dev/null || echo "")

  if [ -z "$EXISTING_RULESET" ]; then
    if [ "$UPDATE_ONLY" = true ]; then
      echo -e "${YELLOW}Ruleset '$ruleset_name' does not exist. Skipping (--update-only mode)${NC}"
      rm "$json_file"
      return
    fi

    echo -e "${GREEN}Creating new ruleset: $ruleset_name${NC}"
    gh api \
      --method POST \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "/repos/$OWNER/$REPO/rulesets" \
      --input "$json_file" > /dev/null

    echo -e "${GREEN}✓ Ruleset '$ruleset_name' created successfully${NC}"
  else
    echo -e "${BLUE}Updating existing ruleset: $ruleset_name (ID: $EXISTING_RULESET)${NC}"
    gh api \
      --method PUT \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "/repos/$OWNER/$REPO/rulesets/$EXISTING_RULESET" \
      --input "$json_file" > /dev/null

    echo -e "${GREEN}✓ Ruleset '$ruleset_name' updated successfully${NC}"
  fi

  rm "$json_file"
}

# Setup ruleset
setup_ruleset "$RULESET_NAME"

echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "View ruleset at: https://github.com/$OWNER/$REPO/settings/rules"
