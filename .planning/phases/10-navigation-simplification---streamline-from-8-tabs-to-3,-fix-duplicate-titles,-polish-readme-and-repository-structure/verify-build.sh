#!/bin/bash

# Absolute paths for Windows Git Bash
RESULTS_FILE="C:/GitHub/datagvat-mcp/.planning/phases/10-navigation-simplification---streamline-from-8-tabs-to-3,-fix-duplicate-titles,-polish-readme-and-repository-structure/build-verification.txt"

echo "=== BUILD VERIFICATION REPORT ===" > "$RESULTS_FILE"
echo "Date: $(date)" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

cd "C:/GitHub/datagvat-mcp/docs"

echo "=== DOCUMENTATION BUILD VERIFICATION ==="
echo ""

echo "1. TypeScript type check..."
START_TIME=$(date +%s)
bun run type-check
TS_EXIT=$?
TS_TIME=$(($(date +%s) - START_TIME))

echo ""
echo "2. Biome lint check..."
START_TIME=$(date +%s)
bunx biome check app components lib scripts --files-ignore-unknown=true
LINT_EXIT=$?
LINT_TIME=$(($(date +%s) - START_TIME))

echo ""
echo "3. Link validation..."
START_TIME=$(date +%s)
bun run lint:links
LINK_EXIT=$?
LINK_TIME=$(($(date +%s) - START_TIME))

echo ""
echo "4. Full build..."
START_TIME=$(date +%s)
bun run build
BUILD_EXIT=$?
BUILD_TIME=$(($(date +%s) - START_TIME))

# Write results to file
echo "=== DOCUMENTATION RESULTS ===" >> "$RESULTS_FILE"
echo "TypeScript: $([ $TS_EXIT -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL (exit $TS_EXIT)") - ${TS_TIME}s" >> "$RESULTS_FILE"
echo "Biome Lint: $([ $LINT_EXIT -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL (exit $LINT_EXIT)") - ${LINT_TIME}s" >> "$RESULTS_FILE"
echo "Link Check: $([ $LINK_EXIT -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL (exit $LINK_EXIT)") - ${LINK_TIME}s" >> "$RESULTS_FILE"
echo "Build: $([ $BUILD_EXIT -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL (exit $BUILD_EXIT)") - ${BUILD_TIME}s" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

if [ $BUILD_TIME -gt 300 ]; then
  echo "⚠️  WARNING: Build time ${BUILD_TIME}s exceeds 5 minute target" >> "$RESULTS_FILE"
else
  echo "✓ Build time ${BUILD_TIME}s under 5 minute target" >> "$RESULTS_FILE"
fi

echo ""
echo "=== DOCUMENTATION RESULTS ==="
echo "TypeScript: $([ $TS_EXIT -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL")"
echo "Biome Lint: $([ $LINT_EXIT -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL")"
echo "Link Check: $([ $LINK_EXIT -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL")"
echo "Build: $([ $BUILD_EXIT -eq 0 ] && echo "✓ PASS" || echo "✗ FAIL") - ${BUILD_TIME}s"

if [ $TS_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ] && [ $LINK_EXIT -eq 0 ] && [ $BUILD_EXIT -eq 0 ]; then
  echo ""
  echo "✓ ALL DOCUMENTATION CHECKS PASSED"
  exit 0
else
  echo ""
  echo "✗ SOME DOCUMENTATION CHECKS FAILED"
  exit 1
fi
