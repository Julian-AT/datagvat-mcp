import { printErrors, readFiles, scanURLs, validateFiles } from 'next-validate-link';

async function validateLinks() {
  console.log('Validating documentation links...');

  try {
    // Scan Next.js routes (Fumadocs pages in docs/[[...slug]])
    const scanned = await scanURLs({
      preset: 'next',
    });

    // Read all MDX content files
    const files = await readFiles('content/docs/**/*.{md,mdx}');

    // Validate all links against scanned URLs
    const results = await validateFiles(files, {
      scanned,
      checkRelativePaths: 'as-url',
      markdown: {
        Card: ['href'],
        Callout: ['href'],
        'Tabs.Tab': ['href'],
      } as Record<string, string[]>,
    });

    // Print errors and exit with code 1 on failure
    printErrors(results, true);

    console.log('✓ All links validated successfully\n');
  } catch (error) {
    console.error('✗ Link validation failed:', error);
    process.exit(1);
  }
}

validateLinks();
