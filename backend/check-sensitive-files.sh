#!/bin/bash

# Script to check for sensitive files before committing
echo "🔍 Checking for sensitive files..."

# Check staged files
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
    echo "No staged files to check."
    exit 0
fi

SENSITIVE_FOUND=false

for file in $STAGED_FILES; do
    # Check filename patterns
    if [[ $file == *"firebase-adminsdk"* ]] || 
       [[ $file == *"service-account"* ]] || 
       [[ $file == *"credentials.json"* ]]; then
        echo "❌ SECURITY WARNING: Sensitive file detected: $file"
        SENSITIVE_FOUND=true
    fi
done

if [ "$SENSITIVE_FOUND" = true ]; then
    echo "🚨 COMMIT BLOCKED: Sensitive files detected!"
    echo "Please remove sensitive files from staging:"
    echo "  git restore --staged <filename>"
    exit 1
else
    echo "✅ No sensitive files detected. Safe to commit!"
    exit 0
fi
