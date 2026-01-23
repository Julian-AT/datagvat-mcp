#!/usr/bin/env python3
"""Remove duplicate H1 headings from MDX files after frontmatter."""

import os
import re
from pathlib import Path

def remove_duplicate_h1(file_path):
    """Remove first H1 heading after frontmatter closing."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern: frontmatter block, optionally followed by imports, then H1
    # Match: ---\n...frontmatter...\n---\n(optional imports)\n# Title\n
    # Allow any content between frontmatter and H1 (imports, blank lines, etc.)
    pattern = r'(^---\r?\n.*?\r?\n---\r?\n(?:.*?\r?\n)*?)^# .*?\r?\n'

    # Replace with just everything before H1 (keep frontmatter and imports)
    new_content = re.sub(pattern, r'\1', content, count=1, flags=re.MULTILINE | re.DOTALL)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            f.write(new_content)
        return True
    return False

def main():
    docs_dir = Path(r'C:\GitHub\datagvat-mcp\docs\content\docs')

    count = 0
    for mdx_file in docs_dir.rglob('*.mdx'):
        if remove_duplicate_h1(mdx_file):
            print(f"Fixed: {mdx_file.relative_to(docs_dir)}")
            count += 1
        else:
            print(f"No change: {mdx_file.relative_to(docs_dir)}")

    print(f"\nTotal files fixed: {count}")

if __name__ == '__main__':
    main()
