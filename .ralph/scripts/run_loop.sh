#!/bin/bash
# Ralph Loop Execution Harness
# Usage: ./.ralph/scripts/run_loop.sh

set -e

PROMPT_FILE=".ralph/prompts/current_task.md"
IMPL_FILE="specs/implementation.md"
MAX_FAILURES=3
FAILURE_COUNT=0

echo "🚀 Starting Ralph Loop..."
echo "📌 Pin: specs/README.md"
echo "📋 Task: $(head -n 1 $PROMPT_FILE 2>/dev/null || echo 'No task file')"

while true; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔄 Loop iteration starting..."

    # Execute Claude Code with the current task
    if claude --dangerously-skip-permissions -p "$(cat $PROMPT_FILE)"; then
        echo "✅ Iteration completed successfully"
        FAILURE_COUNT=0
    else
        ((FAILURE_COUNT++))
        echo "❌ Iteration failed (attempt $FAILURE_COUNT/$MAX_FAILURES)"

        if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
            echo "🛑 Max failures reached. Stopping loop."
            echo "Review logs and update specs before restarting."
            exit 1
        fi
    fi

    # Check if current phase is complete
    if ! grep -q "\- \[ \]" "$IMPL_FILE" 2>/dev/null; then
        echo "🎉 All tasks complete! Stopping loop."
        break
    fi

    echo "⏳ Cooling down before next iteration..."
    sleep 5
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 Ralph Loop finished"
