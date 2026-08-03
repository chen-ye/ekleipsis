import { createRequire } from 'node:module';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const require = createRequire(import.meta.url);
const cesiumPackage = require.resolve('cesium/package.json');
const cesiumSource = normalizePath(
	path.resolve(path.dirname(cesiumPackage), 'Build/Cesium'),
);

// https://vite.dev/config/
export default defineConfig({
	base: '/ekleipsis/',
	define: {
		// Define relative base path in cesium for loading assets
		CESIUM_BASE_URL: JSON.stringify('/ekleipsis/cesiumStatic/'),
	},
	plugins: [
		react(),
		viteStaticCopy({
			targets: [
				{
					src: `${cesiumSource}/*`,
					dest: 'cesiumStatic',
				},
			],
		}),
	],
});
