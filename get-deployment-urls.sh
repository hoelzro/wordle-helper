#!/bin/bash

# Script to fetch Cloudflare Pages deployment URLs for specific branches

CONFIG_FILE=".cloudflare-config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file $CONFIG_FILE not found"
    echo "Please create it with your Cloudflare credentials"
    exit 1
fi

# Read config
ACCOUNT_ID=$(jq -r '.accountId' "$CONFIG_FILE")
API_TOKEN=$(jq -r '.apiToken' "$CONFIG_FILE")
PROJECT_NAME=$(jq -r '.projectName' "$CONFIG_FILE")

if [ "$ACCOUNT_ID" = "YOUR_CLOUDFLARE_ACCOUNT_ID" ] || [ "$API_TOKEN" = "YOUR_CLOUDFLARE_API_TOKEN" ]; then
    echo "Error: Please update $CONFIG_FILE with your actual Cloudflare credentials"
    exit 1
fi

# Get branch names from arguments or use defaults
BRANCHES=("$@")
if [ ${#BRANCHES[@]} -eq 0 ]; then
    echo "Usage: $0 <branch1> [branch2] [branch3] ..."
    echo "Example: $0 claude/random-title-variant-1-011CUvmkGyR7MuSDEDw72o11"
    exit 1
fi

echo "Fetching deployment URLs for project: $PROJECT_NAME"
echo ""

for BRANCH in "${BRANCHES[@]}"; do
    echo "Branch: $BRANCH"

    # Fetch deployments for this branch
    RESPONSE=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")

    # Check if request was successful
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    if [ "$SUCCESS" != "true" ]; then
        echo "  Error fetching deployments:"
        echo "$RESPONSE" | jq -r '.errors[0].message'
        echo ""
        continue
    fi

    # Find the deployment for this branch
    DEPLOYMENT_URL=$(echo "$RESPONSE" | jq -r \
        --arg branch "$BRANCH" \
        '.result[] | select(.deployment_trigger.metadata.branch == $branch) | .url' \
        | head -1)

    if [ -z "$DEPLOYMENT_URL" ] || [ "$DEPLOYMENT_URL" = "null" ]; then
        echo "  No deployment found yet (may still be building)"
    else
        echo "  URL: https://$DEPLOYMENT_URL"
    fi
    echo ""
done
