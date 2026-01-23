#!/usr/bin/env bun
/**
 * Render Remotion videos with file-based caching
 *
 * Only re-renders videos when source files have changed.
 * Checks timestamps of source files vs output files.
 *
 * Usage:
 *   bun run scripts/render-videos.ts [--force]
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { existsSync, statSync, readdirSync } from 'fs';
import path from 'path';

const VIDEO_CONFIGS = [
	{ id: 'QuickStart', output: 'quickstart.mp4', duration: 4500 },
	{ id: 'Workflow', output: 'workflow.mp4', duration: 7200 },
	{ id: 'Architecture', output: 'architecture.mp4', duration: 10800 },
];

/**
 * Get newest modification time of files in directory tree
 */
function getNewestFileTime(dir: string): number {
	let newest = 0;

	function scan(currentDir: string) {
		const entries = readdirSync(currentDir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);
			if (entry.isDirectory()) {
				scan(fullPath);
			} else {
				const mtime = statSync(fullPath).mtime.getTime();
				if (mtime > newest) newest = mtime;
			}
		}
	}

	scan(dir);
	return newest;
}

async function renderVideos(force = false) {
	const sourceDir = path.join(process.cwd(), 'remotion');
	const outputDir = path.join(process.cwd(), 'public', 'videos');

	console.log('🎬 Starting video rendering...\n');

	// Bundle Remotion code
	console.log('📦 Bundling Remotion compositions...');
	const bundleLocation = await bundle({
		entryPoint: path.join(sourceDir, 'Root.tsx'),
		webpackOverride: (config) => config,
	});

	let rendered = 0;
	let cached = 0;

	for (const video of VIDEO_CONFIGS) {
		const outputPath = path.join(outputDir, video.output);

		// Check cache (unless --force flag)
		if (!force && existsSync(outputPath)) {
			const outputTime = statSync(outputPath).mtime.getTime();
			const sourceTime = getNewestFileTime(sourceDir);

			if (sourceTime < outputTime) {
				console.log(`✓ ${video.id} is up to date (cached)`);
				cached++;
				continue;
			}
		}

		console.log(`\n🎥 Rendering ${video.id}...`);

		const composition = await selectComposition({
			serveUrl: bundleLocation,
			id: video.id,
			inputProps: {},
		});

		await renderMedia({
			composition,
			serveUrl: bundleLocation,
			codec: 'h264',
			outputLocation: outputPath,
			crf: 21,
			concurrency: null, // Use config value (50%)
			onProgress: ({ progress }) => {
				process.stdout.write(`\r   Progress: ${(progress * 100).toFixed(1)}%`);
			},
		});

		console.log(`\n✓ ${video.id} rendered to ${video.output}`);
		rendered++;
	}

	console.log(`\n✅ Video rendering complete!`);
	console.log(`   Rendered: ${rendered}`);
	console.log(`   Cached: ${cached}`);
	console.log(`   Total: ${VIDEO_CONFIGS.length}`);
}

// Parse --force flag
const force = process.argv.includes('--force');
if (force) {
	console.log('⚠️  Force mode: Re-rendering all videos\n');
}

renderVideos(force).catch((err) => {
	console.error('❌ Render failed:', err);
	process.exit(1);
});
