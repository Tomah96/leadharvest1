#!/bin/bash
# Archive old documentation files to reduce clutter
# Run from /docs directory

# Create archive directory with timestamp
ARCHIVE_DIR="archive/$(date +%Y%m%d)"
mkdir -p "$ARCHIVE_DIR"

# Define files to archive (older than 7 days and matching patterns)
echo "📦 Archiving old documentation files..."

# Archive day-specific files (keep only last 3 days)
for file in day[0-9]-*.md day[0-9][0-9]-*.md; do
  if [[ -f "$file" ]]; then
    # Extract day number
    day_num=$(echo "$file" | grep -oE 'day[0-9]+' | grep -oE '[0-9]+')
    # Archive if older than day 24 (current is day 27)
    if [[ $day_num -lt 24 ]]; then
      echo "  Archiving: $file"
      mv "$file" "$ARCHIVE_DIR/" 2>/dev/null
    fi
  fi
done

# Archive completed task files (keep active ones)
for file in tasks/backend-day[0-7]*.md tasks/frontend-day[0-7]*.md; do
  if [[ -f "$file" ]]; then
    echo "  Archiving: $file"
    mv "$file" "$ARCHIVE_DIR/" 2>/dev/null
  fi
done

# Archive old session files
for file in *SESSION*.md; do
  if [[ -f "$file" ]]; then
    # Keep only the most recent session file
    if [[ "$file" != "SESSION-CONTEXT-2025-01-08.md" ]]; then
      echo "  Archiving: $file"
      mv "$file" "$ARCHIVE_DIR/" 2>/dev/null
    fi
  fi
done

# Archive duplicate/superseded files
SUPERSEDED=(
  "CLAUDE-PROMPTS-*.md"
  "CLAUDE-TASKS-*.md"
  "*-COMPLETE-REPORT.md"
  "*-restoration-*.md"
  "*-fix-report.md"
  "*-issue-report.md"
  "module-restoration-*.md"
  "npm-recovery-*.md"
  "npm-restoration-*.md"
)

for pattern in "${SUPERSEDED[@]}"; do
  for file in $pattern; do
    if [[ -f "$file" ]]; then
      echo "  Archiving: $file"
      mv "$file" "$ARCHIVE_DIR/" 2>/dev/null
    fi
  done
done

# Count archived files
ARCHIVED_COUNT=$(ls -1 "$ARCHIVE_DIR" 2>/dev/null | wc -l)

if [[ $ARCHIVED_COUNT -gt 0 ]]; then
  echo "✅ Archived $ARCHIVED_COUNT files to $ARCHIVE_DIR/"
  echo ""
  echo "📊 Documentation Statistics:"
  echo "  Active docs: $(ls -1 *.md 2>/dev/null | wc -l)"
  echo "  Task files: $(ls -1 tasks/*.md 2>/dev/null | wc -l)"
  echo "  Lessons: $(ls -1 lessons/*.md 2>/dev/null | wc -l)"
  echo "  Progress reports: $(ls -1 progress-reports/*.md 2>/dev/null | wc -l)"
else
  echo "✨ No files needed archiving - documentation is already organized!"
fi

echo ""
echo "💡 Tip: Review archived files in $ARCHIVE_DIR/ and delete if not needed"