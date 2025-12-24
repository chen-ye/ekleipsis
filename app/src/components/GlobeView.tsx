import { Viewer, CameraFlyTo } from 'resium';
import {
  Cartesian3,
  Viewer as CesiumViewer,
  Cesium3DTileset,
  JulianDate,
  Ion
} from 'cesium';
import { useEffect, useRef, useState } from 'react';
import TimelineControl from './TimelineControl';
import PoiLayer from './PoiLayer';

// Default to Mallorca
const MALLORCA_POSITION = Cartesian3.fromDegrees(3.0176, 39.6953, 20000);
const ECLIPSE_DATE_ISO = '2026-08-12T17:30:00Z'; // Approx time covering eclipse event

const CESIUM_ION_ACCESS_TOKEN = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;

if (CESIUM_ION_ACCESS_TOKEN) {
  Ion.defaultAccessToken = CESIUM_ION_ACCESS_TOKEN;
}

function GlobeView() {
  const viewerRef = useRef<CesiumViewer | null>(null);
  const [tilesetLoaded, setTilesetLoaded] = useState(false);

  useEffect(() => {
    if (viewerRef.current && !tilesetLoaded && CESIUM_ION_ACCESS_TOKEN) {
      // Load Google Photorealistic 3D Tiles via Cesium Ion (Asset ID 2275207)
      Cesium3DTileset.fromIonAssetId(2275207)
        .then((tileset) => {
          if (viewerRef.current) {
            viewerRef.current.scene.primitives.add(tileset);
            setTilesetLoaded(true);
          }
        })
        .catch((err) => {
          console.error("Failed to load Cesium Ion Tiles:", err);
        });
    }
  }, [tilesetLoaded]);

  // Configure Shadows and Lighting on mount
  useEffect(() => {
    if (viewerRef.current) {
      const viewer = viewerRef.current;
      viewer.scene.globe.enableLighting = true;
      viewer.shadows = true;
      viewer.terrainShadows = 1; // cast and receive

      // Set time
      const date = JulianDate.fromIso8601(ECLIPSE_DATE_ISO);
      viewer.clock.currentTime = date;
      viewer.clock.shouldAnimate = false; // Start paused
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {!CESIUM_ION_ACCESS_TOKEN && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 100,
          background: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px'
        }}>
          Warning: VITE_CESIUM_ION_ACCESS_TOKEN is missing.
        </div>
      )}
      <Viewer
        full
        ref={(e) => {
            if (e && e.cesiumElement) viewerRef.current = e.cesiumElement;
        }}
        timeline={true} // We will replace with custom later, but keep for debug
        animation={false}
        baseLayerPicker={false} // Hide layer picker as we force Google Tiles
        homeButton={false}
        geocoder={false} // We will implement custom geocoder
        sceneModePicker={false}
        selectionIndicator={false}
        infoBox={false} // Custom info box
      >
        <CameraFlyTo destination={MALLORCA_POSITION} duration={0} />
        <TimelineControl />
        <PoiLayer />
      </Viewer>
    </div>
  );
}

export default GlobeView;
