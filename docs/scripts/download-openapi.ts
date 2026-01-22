const SCHEMA_URL = 'https://qs.data.gv.at/api/hub/repo/openapi.yaml';
const OUTPUT_PATH = './data.gv.at-openapi.yaml';

// Media types not supported by fumadocs-openapi (RDF formats)
const UNSUPPORTED_MEDIA_TYPES = [
  'application/n-triples',
  'text/turtle',
  'application/rdf+xml',
  'application/ld+json',
  'application/n-quads',
  'application/trig',
  'application/trix',
  'text/n3',
];

async function main() {
  console.log('Downloading OpenAPI schema...');
  console.log(`  Source: ${SCHEMA_URL}`);
  console.log(`  Target: ${OUTPUT_PATH}`);
  console.log('');

  try {
    // Fetch schema from data.gv.at
    const response = await fetch(SCHEMA_URL);

    if (!response.ok) {
      throw new Error(`Failed to download schema: HTTP ${response.status} ${response.statusText}`);
    }

    let yaml = await response.text();

    // Validate it's an OpenAPI schema
    if (!yaml.includes('openapi:')) {
      throw new Error('Invalid schema: missing "openapi:" field. Schema may be corrupted.');
    }

    // Check version (fumadocs-openapi requires 3.0 or 3.1)
    const versionMatch = yaml.match(/openapi:\s*['"]?(\d+\.\d+)/);
    if (!versionMatch) {
      throw new Error('Cannot determine OpenAPI version. Schema format is invalid.');
    }

    const version = versionMatch[1];
    if (!['3.0', '3.1'].includes(version)) {
      throw new Error(
        `Unsupported OpenAPI version: ${version}. fumadocs-openapi requires 3.0 or 3.1`
      );
    }

    // Remove unsupported RDF media types from content sections
    let removedCount = 0;
    for (const mediaType of UNSUPPORTED_MEDIA_TYPES) {
      // Match the media type and all subsequent lines that are indented more than it
      const lines = yaml.split('\n');
      const newLines = [];
      let skipMode = false;
      let mediaTypeIndent = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(\s*)(.*)$/);
        if (!match) {
          newLines.push(line);
          continue;
        }

        const indent = match[1].length;
        const content = match[2];

        // Check if this line starts a media type section we want to remove
        if (content.startsWith(`${mediaType}:`)) {
          skipMode = true;
          mediaTypeIndent = indent;
          removedCount++;
          continue;
        }

        // If we're in skip mode, check if we should exit
        if (skipMode) {
          // Exit skip mode if we hit a line at same or less indentation
          if (content && indent <= mediaTypeIndent) {
            skipMode = false;
          } else {
            // Skip this line (it's part of the media type block)
            continue;
          }
        }

        newLines.push(line);
      }

      yaml = newLines.join('\n');
    }

    // Fix empty content sections by adding a placeholder
    // This happens when all media types were RDF formats
    // Look for content: followed by next line that isn't more indented
    const contentFixLines = [];
    const yamlLines = yaml.split('\n');

    for (let i = 0; i < yamlLines.length; i++) {
      const line = yamlLines[i];
      const match = line.match(/^(\s+)content:\s*$/);

      if (match) {
        const contentIndent = match[1].length;
        const nextLine = yamlLines[i + 1] || '';
        const nextLineIndent = nextLine.match(/^(\s*)/)?.[1].length || 0;

        // If next line is not more indented, content is empty
        if (nextLineIndent <= contentIndent) {
          const baseIndent = match[1];
          contentFixLines.push(line);
          contentFixLines.push(`${baseIndent}  application/json:`);
          contentFixLines.push(`${baseIndent}    schema:`);
          contentFixLines.push(`${baseIndent}      type: object`);
          contentFixLines.push(
            `${baseIndent}      description: "RDF format data (original schema contained only RDF media types not supported by documentation generator)"`
          );
          continue;
        }
      }

      contentFixLines.push(line);
    }

    yaml = contentFixLines.join('\n');

    // Write to disk
    await Bun.write(OUTPUT_PATH, yaml);

    // Success output
    console.log('✓ Schema downloaded successfully');
    console.log(`  Version: OpenAPI ${version}`);
    console.log(`  Size: ${(yaml.length / 1024).toFixed(2)} KB`);
    if (removedCount > 0) {
      console.log(`  ⚠️  Removed ${removedCount} unsupported RDF media type sections`);
      console.log(`     (${UNSUPPORTED_MEDIA_TYPES.join(', ')})`);
    }
    console.log('');
  } catch (error: unknown) {
    console.error('✗ Failed to download schema');
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
    } else {
      console.error(`  Error: ${String(error)}`);
    }
    console.error('');
    process.exit(1);
  }
}

main();
