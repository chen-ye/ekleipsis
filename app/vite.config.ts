import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	base: '/ekleipsis/',
	define: {
		// Define relative base path in cesium for loading assets
		CESIUM_BASE_URL: JSON.stringify('/ekleipsis/cesiumStatic/'),
	},
	plugins: [react()],
});
