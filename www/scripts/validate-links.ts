import { printErrors, readFiles, scanURLs, validateFiles } from 'next-validate-link';

async function validateLinks() {
  console.log('Validating documentation links...');

  try {
    const scanned = await scanURLs({
      preset: 'next',
    });

    const files = await readFiles('content/(docs)/**/*.{md,mdx}');

    const results = await validateFiles(files, {
      scanned,
      checkRelativePaths: 'as-url',
      markdown: {
        Card: ['href'],
        Callout: ['href'],
        'Tabs.Tab': ['href'],
      } as Record<string, string[]>,
    });

    printErrors(results, true);

    console.log('✓ All links validated successfully\n');
  } catch (error) {
    console.error('✗ Link validation failed:', error);
    process.exit(1);
  }
}

validateLinks();
