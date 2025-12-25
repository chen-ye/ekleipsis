import {
  Viewer,
  CameraFlyTo,
  Sun,
  SkyAtmosphere,
  Moon,
  Globe,
  Clock,
  Cesium3DTilesTerrainProvider,
  Cesium3DTileset
} from 'resium';
import {
  Cartesian3,
  Viewer as CesiumViewer,
  JulianDate,
  Ion,
  ShadowMode,
  ClockRange,
  ClockStep,
  IonResource
} from 'cesium';
import { useState } from 'react';
import TimelineControl from './TimelineControl';
import PoiLayer from './PoiLayer';

// Default to Mallorca
const MALLORCA_POSITION = Cartesian3.fromDegrees(3.0176, 39.6953, 20000);
const ECLIPSE_DATE_ISO = '2026-08-12T18:31:49Z'; // Max Eclipse at Mallorca (18:31:49 UTC)
const ECLIPSE_DATE = JulianDate.fromIso8601(ECLIPSE_DATE_ISO);

const CESIUM_ION_ACCESS_TOKEN = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;

if (CESIUM_ION_ACCESS_TOKEN) {
  Ion.defaultAccessToken = CESIUM_ION_ACCESS_TOKEN;
}

function GlobeView() {
  const [viewer, setViewer] = useState<CesiumViewer | null>(null);

  // We rely on the Cesium3DTilesTerrainProvider component directly now.
  // We can track readiness if we attach an onReady ref or similar, but for now we trust it loads.

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
            if (e && e.cesiumElement) setViewer(e.cesiumElement);
        }}
        timeline={true}
        animation={false}
        baseLayerPicker={true}
        homeButton={false}
        geocoder={false}
        sceneModePicker={false}
        selectionIndicator={false}
        infoBox={false}
        shadows={true}
        terrainShadows={ShadowMode.ENABLED}
      >
        <Globe
            enableLighting={true}
            dynamicAtmosphereLighting={true}
            dynamicAtmosphereLightingFromSun={true}
        />

        {/* Load Google Photorealistic 3D Tiles as Terrain */}
        {CESIUM_ION_ACCESS_TOKEN && (
            // <Cesium3DTilesTerrainProvider url={IonResource.fromAssetId(3956)} requestVertexNormals={true} />
            // <Cesium3DTilesTerrainProvider url={IonResource.fromAssetId(2275207)} />
            <Cesium3DTileset url={IonResource.fromAssetId(2275207)} />
        )}

        <Clock
            startTime={JulianDate.addHours(ECLIPSE_DATE, -5, new JulianDate())}
            stopTime={JulianDate.addHours(ECLIPSE_DATE, 5, new JulianDate())}
            currentTime={ECLIPSE_DATE}
            multiplier={1}
            shouldAnimate={false}
            clockRange={ClockRange.CLAMPED}
            clockStep={ClockStep.SYSTEM_CLOCK_MULTIPLIER}
        />
        <CameraFlyTo destination={MALLORCA_POSITION} duration={0} />
        <Sun />
        <Moon />
        <SkyAtmosphere />
        <TimelineControl />
        <PoiLayer />
      </Viewer>
    </div>
  );
}

export default GlobeView;
