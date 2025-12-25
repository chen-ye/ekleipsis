import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// Cesium is installed in the root node_modules due to workspaces
const cesiumSource = '../node_modules/cesium/Build/Cesium'
// This is the base url for static files that CesiumJS needs to load.
const cesiumBaseUrl = 'cesiumStatic'

// https://vite.dev/config/
export default defineConfig({
  base: '/ekleipsis/',
  define: {
    // Define relative base path in cesium for loading assets
    CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
  },
  plugins: [
    react(),
    // Copy Cesium Assets, Widgets, and Workers to a static directory.
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
      ],
    }),
  ],
})
