import { createRequire } from 'node:module';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const require = createRequire(import.meta.url);
const cesiumPackage = require.resolve('cesium/package.json');
const cesiumSourceAbs = path.resolve(
	path.dirname(cesiumPackage),
	'Build/Cesium',
);
const cesiumSourceRel = normalizePath(
	path.relative(process.cwd(), cesiumSourceAbs),
);

// https://vite.dev/config/
export default defineConfig({
	base: '/ekleipsis/',
	build: {
		emptyOutDir: true,
	},
	define: {
		CESIUM_BASE_URL: JSON.stringify('/ekleipsis/cesiumStatic/'),
	},
	plugins: [
		react(),
		viteStaticCopy({
			targets: [
				{
					src: `${cesiumSourceRel}/Workers/**/*`,
					dest: 'cesiumStatic/Workers',
				},
				{
					src: `${cesiumSourceRel}/ThirdParty/**/*`,
					dest: 'cesiumStatic/ThirdParty',
				},
				{
					src: `${cesiumSourceRel}/Assets/**/*`,
					dest: 'cesiumStatic/Assets',
				},
				{
					src: `${cesiumSourceRel}/Widgets/**/*`,
					dest: 'cesiumStatic/Widgets',
				},
			],
		}),
	],
});
