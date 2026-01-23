#!/bin/bash
# Remove duplicate H1 headings from MDX files
# Pattern: After frontmatter closing ---, remove first H1 that duplicates title

cd "C:/GitHub/datagvat-mcp/docs/content/docs"

find . -name "*.mdx" -type f | while read -r file; do
  # Create temp file
  temp_file="${file}.tmp"
  
  # Use awk to remove first H1 after frontmatter
  awk '
  BEGIN { in_frontmatter=0; frontmatter_closed=0; h1_removed=0 }
  /^---$/ { 
    if (in_frontmatter == 0) {
      in_frontmatter = 1
    } else if (frontmatter_closed == 0) {
      frontmatter_closed = 1
    }
    print
    next
  }
  frontmatter_closed == 1 && h1_removed == 0 && /^# / {
    h1_removed = 1
    next
  }
  { print }
  ' "$file" > "$temp_file"
  
  # Replace original with temp
  mv "$temp_file" "$file"
  echo "Processed: $file"
done
