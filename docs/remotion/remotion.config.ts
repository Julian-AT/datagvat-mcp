import { Config } from '@remotion/cli/config';

Config.setConcurrency('50%'); // Use half CPU cores
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setCrf(21); // Quality/size balance for 1080p
Config.setPixelFormat('yuv420p'); // Broad browser compatibility
Config.setOverwriteOutput(true);
