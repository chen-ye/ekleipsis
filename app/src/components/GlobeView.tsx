import {
  Viewer,
  CameraFlyTo,
  Sun,
  SkyAtmosphere,
  Moon,
  Globe,
  Clock,
  Cesium3DTileset,
  ShadowMap,
  Scene,
} from 'resium';
import {
  Cartesian3,
  Viewer as CesiumViewer,
  Clock as CesiumClock,
  JulianDate,
  Ion,
  ShadowMode,
  ClockRange,
  ClockStep,
  IonResource,
  Terrain,
  CesiumTerrainProvider,
  ImageBasedLighting,
  Cartesian2,
} from 'cesium';
import { useState, useMemo, useEffect } from 'react';
import TimelineControl from './TimelineControl';
import PoiLayer from './PoiLayer';
import { calculateEclipseCoverage, getEclipseTiming } from '../utils/eclipseCalculator';
import { ECLIPSE_DATE_BASE, MALLORCA_LAT, MALLORCA_LNG } from '../constants/eclipse';

// Default to Mallorca
// const MALLORCA_POSITION = Cartesian3.fromDegrees(MALLORCA_LNG, MALLORCA_LAT, 20000);

export interface DataPoint {
  date: Date;
  coverage: number;
}

const CESIUM_ION_ACCESS_TOKEN = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;

if (CESIUM_ION_ACCESS_TOKEN) {
  Ion.defaultAccessToken = CESIUM_ION_ACCESS_TOKEN;
}

interface GlobeViewProps {
    cameraDestination: Cartesian3;
    onFlyTo: (destination: Cartesian3) => void;
}

function GlobeView({ cameraDestination, onFlyTo }: GlobeViewProps) {
  const [viewer, setViewer] = useState<CesiumViewer | null>(null);

  // Compute eclipse timing dynamically based on Mallorca location
  const eclipseTiming = useMemo(() => {
    const baseDate = new Date(ECLIPSE_DATE_BASE);
    return getEclipseTiming(baseDate, MALLORCA_LAT, MALLORCA_LNG);
  }, []);

  /* Existing useMemo */
  const { startJD, endJD, totalityStartJD, totalityEndJD } = useMemo(() => {
    if (!eclipseTiming) return { startJD: JulianDate.now(), endJD: JulianDate.now() };
    return {
      startJD: JulianDate.fromDate(eclipseTiming.startTime),
      endJD: JulianDate.fromDate(eclipseTiming.endTime),
      totalityStartJD: eclipseTiming.totalityStartTime ? JulianDate.fromDate(eclipseTiming.totalityStartTime) : undefined,
      totalityEndJD: eclipseTiming.totalityEndTime ? JulianDate.fromDate(eclipseTiming.totalityEndTime) : undefined
    };
  }, [eclipseTiming]);

  // Generate graph data (lifted from TimelineControl)
  const coverageData = useMemo(() => {
    if (!eclipseTiming) return [];

    // Use the exact start/end from timing
    const startTime = eclipseTiming.startTime;
    const endTime = eclipseTiming.endTime;

    const points: DataPoint[] = [];
    // Increase steps for acceptable resolution (e.g. 1 point per ~minute or so, or fixed count)
    // 500 steps gives good granularity for smooth interpolation
    const steps = 500;
    const stepMs = (endTime.getTime() - startTime.getTime()) / steps;

    for (let i = 0; i <= steps; i++) {
        const time = new Date(startTime.getTime() + i * stepMs);
        const coverage = calculateEclipseCoverage(time, MALLORCA_LAT, MALLORCA_LNG);
        points.push({ date: time, coverage });
    }
    return points;
  }, [eclipseTiming]);

  useEffect(() => {
    if (!viewer || !startJD || !endJD) return;

    const updateSkyBrightness = (clock: CesiumClock) => {
        const time = clock.currentTime;
        const sky = viewer.scene.skyAtmosphere;
        if (!sky) {
            return;
        }

        // 1. Check Totality (Inclusive)
        if (totalityStartJD && totalityEndJD) {
            if (JulianDate.greaterThanOrEquals(time, totalityStartJD) && JulianDate.lessThanOrEquals(time, totalityEndJD)) {
                sky.brightnessShift = -1.0;
                return;
            }
        }

        // 2. Check Partial Phases
        // Ingress: start <= time < totalityStart
        if (totalityStartJD && JulianDate.greaterThanOrEquals(time, startJD) && JulianDate.lessThan(time, totalityStartJD)) {
            const totalSeconds = JulianDate.secondsDifference(totalityStartJD, startJD);
            const elapsed = JulianDate.secondsDifference(time, startJD);
            const progress = Math.max(0, Math.min(1, elapsed / totalSeconds));
            // Non-linear darkening: stays bright, then drops fast
            sky.brightnessShift = -1.0 * Math.pow(progress, 4);
            return;
        }

        // Egress: totalityEnd < time <= end
        if (totalityEndJD && JulianDate.greaterThan(time, totalityEndJD) && JulianDate.lessThanOrEquals(time, endJD)) {
            const totalSeconds = JulianDate.secondsDifference(endJD, totalityEndJD);
            // Calculate progress "backwards" from end - symmetry with logic
            // Ingress: (time - start) / total. 0 at start, 1 at totality.
            // Egress: (end - time) / total. 0 at end, 1 at totality.
            const remaining = JulianDate.secondsDifference(endJD, time);
            const progress = Math.max(0, Math.min(1, remaining / totalSeconds));

            // Non-linear brightening: exactly symmetrical to ingress
            sky.brightnessShift = -1.0 * Math.pow(progress, 4);
            return;
        }

        // 3. Defaults
        sky.brightnessShift = 0.0;
    };

    // Run immediately to set initial state
    updateSkyBrightness(viewer.clock);

    // Listen to ticks
    viewer.clock.onTick.addEventListener(updateSkyBrightness);
    return () => {
      viewer.clock.onTick.removeEventListener(updateSkyBrightness);
    };
  }, [viewer, startJD, endJD, totalityStartJD, totalityEndJD, coverageData]);

  useEffect(() => {
      if (viewer && eclipseTiming) {
          viewer.timeline?.zoomTo?.(startJD, endJD);
      }
  }, [viewer, eclipseTiming, startJD, endJD]);

  if (!eclipseTiming) return <div>Computing eclipse data...</div>;



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
            if (e && e.cesiumElement) {
                const viewer = e.cesiumElement;
                setViewer(viewer);

                viewer.shadowMap.fadingEnabled = false;
            }
        }}
        // timeline={true}
        timeline={false}
        animation={false}
        baseLayerPicker={true}
        homeButton={false}
        geocoder={false}
        sceneModePicker={false}
        selectionIndicator={false}
        infoBox={false}
        shadows={true}
        // terrain={Terrain.fromWorldTerrain()}
        terrainShadows={ShadowMode.ENABLED}
      >
        <ShadowMap
          size={2048}
          maximumDistance={30000}
          darkness={0.3}
          fadingEnabled={false}
          softShadows={true}
        />
        <Scene
          highDynamicRange={false}
          logarithmicDepthBuffer={true}
        />
        <Globe
            enableLighting={true}
            dynamicAtmosphereLighting={true}
            dynamicAtmosphereLightingFromSun={true}
            depthTestAgainstTerrain={true}
            atmosphereLightIntensity={20}
            vertexShadowDarkness={1}
            show={false}
            terrainProvider={CesiumTerrainProvider.fromIonAssetId(1)}
            lightingFadeInDistance={Number.POSITIVE_INFINITY}
            lightingFadeOutDistance={Number.POSITIVE_INFINITY}
            nightFadeInDistance={Number.POSITIVE_INFINITY}
            nightFadeOutDistance={Number.POSITIVE_INFINITY}
        />

        {/* Load Google Photorealistic 3D Tiles as Terrain */}
        {CESIUM_ION_ACCESS_TOKEN && (
            <Cesium3DTileset
              url={IonResource.fromAssetId(2275207)}
              enableCollision={true}
            />
        )}

        <Clock
            startTime={startJD}
            stopTime={endJD}
            currentTime={totalityStartJD || startJD}
            multiplier={1}
            shouldAnimate={false}
            clockRange={ClockRange.CLAMPED}
            clockStep={ClockStep.SYSTEM_CLOCK_MULTIPLIER}
        />
        <CameraFlyTo destination={cameraDestination} duration={2} />
        <Sun />
        <Moon />

        <TimelineControl
          startTime={eclipseTiming.startTime}
          endTime={eclipseTiming.endTime}
          totalityStartTime={eclipseTiming.totalityStartTime}
          totalityEndTime={eclipseTiming.totalityEndTime}
          data={coverageData}
      />
        <PoiLayer onPoiClick={onFlyTo} />
      </Viewer>
    </div>
  );
}

export default GlobeView;
