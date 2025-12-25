# Ekleipsis

**Ekleipsis** is a comprehensive 3D visualization and planning tool designed for the **2026 Solar Eclipse**. It provides detailed simulations of the eclipse event, focusing on visibility from specific locations like Mallorca.

## Project Structure

This repository contains two main components:

- **`app/`**: The core web application built with React, Vite, and CesiumJS. It powers the 3D globe visualization, timeline simulation, and POI management.
- **`extension/`**: A browser extension (WXT) designed to augment external planning tools or gather data (e.g., from Airbnb) for the trip.

## Technology Stack

- **Frontend**: [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **UI Framework**: [Radix UI Themes](https://www.radix-ui.com/themes)
- **3D Engine**: [CesiumJS](https://cesium.com/platform/cesiumjs/) via [Resium](https://resium.darwineducation.com/)
- **Extension Framework**: [WXT](https://wxt.dev/)

## Setup & Running

### Web Application

1.  Navigate to the app directory:
    ```bash
    cd app
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env.local` file in the `app` directory and add your Cesium Ion Access Token:
    ```env
    VITE_CESIUM_ION_ACCESS_TOKEN=your_token_here
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

### Browser Extension

1.  Navigate to the extension directory:
    ```bash
    cd extension
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build or Run:
    ```bash
    npm run dev
    # or
    npm run build
    ```

## Features

- **Eclipse Simulation**: Precise timeline control for the partial and total eclipse phases (configured for Mallorca, Aug 12, 2026).
- **3D Terrain**: Realistic globe rendering with Google Photorealistic 3D Tiles.
- **POI Management**: Import GPX, KML, and GeoJSON files to plan viewing spots.
- **Airbnb Data**: (Via extension) Integration for finding accommodation.

## License

MIT.
