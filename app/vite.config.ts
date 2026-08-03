import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, normalizePath, searchForWorkspaceRoot } from 'vite';
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
	server: {
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd())],
		},
	},
	build: {
		emptyOutDir: true,
	},
	define: {
		CESIUM_BASE_URL: JSON.stringify('/ekleipsis/cesiumStatic/'),
	},
	plugins: [
		react(),
		{
			name: 'cesium-dev-server',
			configureServer(server) {
				server.middlewares.use('/ekleipsis/cesiumStatic', (req, res, next) => {
					if (!req.url) return next();
					const filePath = path.join(cesiumSourceAbs, req.url.split('?')[0]);
					if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
						return fs.createReadStream(filePath).pipe(res);
					}
					next();
				});
			},
		},
		viteStaticCopy({
			targets: [
				{
					src: `${cesiumSourceRel}/Workers/**/*`,
					dest: 'cesiumStatic/Workers',
					rename: { stripBase: 6 },
				},
				{
					src: `${cesiumSourceRel}/ThirdParty/**/*`,
					dest: 'cesiumStatic/ThirdParty',
					rename: { stripBase: 6 },
				},
				{
					src: `${cesiumSourceRel}/Assets/**/*`,
					dest: 'cesiumStatic/Assets',
					rename: { stripBase: 6 },
				},
				{
					src: `${cesiumSourceRel}/Widgets/**/*`,
					dest: 'cesiumStatic/Widgets',
					rename: { stripBase: 6 },
				},
			],
		}),
	],
});
