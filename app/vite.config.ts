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

const MIME_TYPES: Record<string, string> = {
	'.js': 'application/javascript; charset=utf-8',
	'.mjs': 'application/javascript; charset=utf-8',
	'.cjs': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.wasm': 'application/wasm',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.svg': 'image/svg+xml',
	'.xml': 'application/xml',
	'.glsl': 'text/plain',
};

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
						const ext = path.extname(filePath).toLowerCase();
						const contentType = MIME_TYPES[ext] || 'application/octet-stream';
						res.setHeader('Content-Type', contentType);
						return fs.createReadStream(filePath).pipe(res);
					}
					next();
				});
			},
		},
		viteStaticCopy({
			targets: [
				{
					src: `${cesiumSourceRel}/**/*`,
					dest: 'cesiumStatic',
					rename: { stripBase: 4 },
				},
			],
		}),
	],
});
