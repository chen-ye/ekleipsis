import {
  Viewer,
  Sun,
  Moon,
  Globe,
  Clock,
  Cesium3DTileset,
  ShadowMap,
  Scene,
  ImageryLayer,
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
  CesiumTerrainProvider,
  Cartographic,
  Math as CesiumMath,
  Transforms,
  Matrix4,
  UrlTemplateImageryProvider,
} from 'cesium';
import { useState, useMemo, useEffect } from 'react';
import TimelineControl from './TimelineControl';
import PoiLayer from './PoiLayer';
import Sidebar from './Sidebar';
import { SegmentedControl, Switch, Flex, Text, Box } from '@radix-ui/themes';
import { calculateEclipseCoverage, getEclipseTiming, getSunPosition } from '../utils/eclipseCalculator';
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
  const [show3DTiles, setShow3DTiles] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

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

  // Calculate "Over the Shoulder" view:
  // Camera positioned behind the POI, looking towards the POI and the Sun.
  const flyToState = useMemo(() => {
     if (!eclipseTiming || !cameraDestination) return undefined;

     // 1. Get Lat/Lng of destination (POI)
     const cartographic = Cartographic.fromCartesian(cameraDestination);
     const lat = CesiumMath.toDegrees(cartographic.latitude);
     const lng = CesiumMath.toDegrees(cartographic.longitude);

     // 2. Get Sun Position at peak time
     const sunPos = getSunPosition(eclipseTiming.peakTime, lat, lng, 0);
     const sunAzRad = CesiumMath.toRadians(sunPos.azimuth);

     // 3. Calculate Camera Offset
     // We want to be "behind" the POI relative to the Sun.
     // So we move in the direction opposite to Sun Azimuth.
     const range = 3000; // 3km back
     const heightOffset = 1000; // 1km up

     // ENU: +x is East, +y is North.
     // Azimuth 0 is North (+y). 90 is East (+x).
     // Target Direction (Sun) = Az.
     // Backwards Direction = Az + PI.
     const offsetX = range * Math.sin(sunAzRad + Math.PI);
     const offsetY = range * Math.cos(sunAzRad + Math.PI);
     const offsetZ = heightOffset;

     // 4. Transform Local Offset to World Coordinates
     const enuMatrix = Transforms.eastNorthUpToFixedFrame(cameraDestination);
     const offset = new Cartesian3(offsetX, offsetY, offsetZ);
     const finalDest = new Cartesian3();
     Matrix4.multiplyByPoint(enuMatrix, offset, finalDest);

     // 5. Orientation
     // Heading: Look at Sun (sunAzRad)
     // Pitch: Look somewhat down to see POI context (-20 deg)
     return {
         destination: finalDest,
         orientation: {
             heading: sunAzRad,
             pitch: CesiumMath.toRadians(-20),
             roll: 0
         }
     };
  }, [cameraDestination, eclipseTiming]);

  // Memoize providers to prevent reloading on re-renders
  const terrainProvider = useMemo(() => CesiumTerrainProvider.fromIonAssetId(1), []);

  const heatmapProvider = useMemo(() => new UrlTemplateImageryProvider({
      url: 'https://strava-heatmap-proxy.cye.workers.dev/global/orange/all/{z}/{x}/{y}@2x.png',
      enablePickFeatures: false
  }), []);

  const tilesetUrl = useMemo(() => IonResource.fromAssetId(2275207), []);

  // Imperative FlyTo to prevent resets on re-render (e.g. terrain toggle)
  useEffect(() => {
    if (!viewer || !cameraDestination) return;

    const target = flyToState?.destination ?? cameraDestination;
    const orientation = flyToState?.orientation;

    viewer.camera.flyTo({
        destination: target,
        orientation: orientation,
        duration: 2
    });
  }, [viewer, cameraDestination, flyToState]);

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
          padding: '16px',
          borderRadius: '4px'
        }}>
          Warning: VITE_CESIUM_ION_ACCESS_TOKEN is missing.
        </div>
      )}


      <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 100,
      }}>
        <Sidebar onPoiClick={onFlyTo} />
      </div>

      <Flex direction="column" gap="2" style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 100,
      }}>
        <SegmentedControl.Root
          value={show3DTiles ? 'google' : 'cesium'}
          onValueChange={(val) => setShow3DTiles(val === 'google')}
          radius="full"
          size="2"
          style={{
            backdropFilter: 'blur(16px)',
          }}
        >
          <SegmentedControl.Item value="google">Google 3D</SegmentedControl.Item>
          <SegmentedControl.Item value="cesium">Cesium World</SegmentedControl.Item>
        </SegmentedControl.Root>

        <Box style={{
            background: 'var(--color-panel-translucent)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-3)',
            border: '1px solid var(--gray-a4)',
            backdropFilter: 'blur(16px)',
        }}>
            <Flex gap="2" align="center">
                <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} size="1" />
                <Text size="2" color="gray" highContrast>Strava Heatmap</Text>
            </Flex>
        </Box>
      </Flex>

      <Viewer
        full
        fullscreenButton={false}
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
        baseLayerPicker={false}
        homeButton={false}
        geocoder={false}
        sceneModePicker={false}
        selectionIndicator={false}
        infoBox={false}
        shadows={true}
        // terrain={Terrain.fromWorldTerrain()}
        terrainShadows={ShadowMode.ENABLED}
        resolutionScale={1}
        useBrowserRecommendedResolution={false}
        navigationHelpButton={false}
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
            show={!show3DTiles}
            terrainProvider={terrainProvider}
            lightingFadeInDistance={Number.POSITIVE_INFINITY}
            lightingFadeOutDistance={Number.POSITIVE_INFINITY}
            nightFadeInDistance={Number.POSITIVE_INFINITY}
            nightFadeOutDistance={Number.POSITIVE_INFINITY}
        />

        {/* Load Google Photorealistic 3D Tiles as Terrain */}
        {CESIUM_ION_ACCESS_TOKEN && (
            <Cesium3DTileset
              url={tilesetUrl}
              enableCollision={true}
              show={show3DTiles}
            />
        )}

        <ImageryLayer
            alpha={0.8}
            show={showHeatmap}
            imageryProvider={heatmapProvider}
        />

        <Clock
            startTime={startJD}
            stopTime={endJD}
            currentTime={totalityStartJD || startJD}
            multiplier={1}
            shouldAnimate={false}
            clockRange={ClockRange.CLAMPED}
            clockStep={ClockStep.SYSTEM_CLOCK_MULTIPLIER}
        />

        <Sun />
        <Moon />

        <TimelineControl
          startTime={eclipseTiming.startTime}
          endTime={eclipseTiming.endTime}
          totalityStartTime={eclipseTiming.totalityStartTime}
          totalityEndTime={eclipseTiming.totalityEndTime}
          data={coverageData}
      />
        <PoiLayer onPoiClick={onFlyTo} clampTo3DTiles={show3DTiles} />
      </Viewer>
    </div>
  );
}

export default GlobeView;
