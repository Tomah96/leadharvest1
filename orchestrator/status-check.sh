#!/bin/bash
# Orchestrator Status Check Script

echo "=== LeadHarvest CRM - Day 2 Status Check ==="
echo "Time: $(date)"
echo ""

# Check Backend Status
echo "📦 Backend Status:"
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend server is running"
    echo "   Health check response: $(curl -s http://localhost:3001/api/health)"
else
    echo "❌ Backend server is not running"
fi

# Check for new backend files
echo ""
echo "📁 Backend Day 2 Files:"
if [ -d "/mnt/c/Users/12158/LeadHarvest/backend/src/controllers" ]; then
    lead_files=$(find /mnt/c/Users/12158/LeadHarvest/backend/src/controllers -name "*lead*" 2>/dev/null | wc -l)
    echo "   Lead controller files: $lead_files"
fi
if [ -d "/mnt/c/Users/12158/LeadHarvest/backend/src/routes" ]; then
    route_files=$(find /mnt/c/Users/12158/LeadHarvest/backend/src/routes -name "*.js" 2>/dev/null | wc -l)
    echo "   Route files: $route_files"
fi

# Check Frontend Status
echo ""
echo "🎨 Frontend Status:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend server is running"
else
    echo "❌ Frontend server is not running"
fi

# Check documentation updates
echo ""
echo "📝 Documentation Updates:"
echo "   Progress reports: $(grep -c "Day 2" /mnt/c/Users/12158/LeadHarvest/docs/progress-reports.md 2>/dev/null || echo 0) mentions"
echo "   Blockers: $(grep -c "BLOCKED" /mnt/c/Users/12158/LeadHarvest/docs/blockers-and-issues.md 2>/dev/null || echo 0) active"

# Check git status
echo ""
echo "🔧 Git Status:"
cd /mnt/c/Users/12158/LeadHarvest
current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "   Current branch: $current_branch"
echo "   Uncommitted changes: $(git status --porcelain 2>/dev/null | wc -l || echo "unknown")"

echo ""
echo "=== End Status Check ==="