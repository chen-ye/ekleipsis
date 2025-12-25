import { Entity, PolylineGraphics } from 'resium';
import { Cartesian3, Color, HeightReference, VerticalOrigin } from 'cesium';
import { usePoi } from '../contexts/PoiContext';
import { useMemo } from 'react';
import { createMarkerImage } from '../utils/markerUtils';
import { HomeIcon, EyeOpenIcon, SewingPinIcon } from '@radix-ui/react-icons';

// Hardcoded Iris 9 color from Radix UI
const ACCENT_COLOR = '#5b5bd6';

export default function PoiLayer({ onPoiClick, clampTo3DTiles = true }: { onPoiClick?: (position: Cartesian3) => void, clampTo3DTiles?: boolean }) {
  const { pois } = usePoi();

  // Pre-generate marker images to avoid recalculating on every render
  const markerImages = useMemo(() => ({
    booking: createMarkerImage(HomeIcon, ACCENT_COLOR),
    viewpoint: createMarkerImage(EyeOpenIcon, ACCENT_COLOR),
    geocoded: createMarkerImage(SewingPinIcon, ACCENT_COLOR), // Fallback/Generic pin
  }), []);

  if (!pois || pois.length === 0) return null;

  return (
    <>
      {pois.map((poi) => {
        if (poi.type === 'track' && poi.path) {
           const positions = poi.path.map(p => Cartesian3.fromDegrees(p.lng, p.lat, p.alt || 0));
           const clickPosition = positions[0]; // Fly to start of track
           return (
             <Entity
               key={poi.id}
               name={poi.name}
               description={poi.description}
               onClick={() => onPoiClick?.(clickPosition)}
             >
               <PolylineGraphics
                 positions={positions}
                 width={4}
                 material={Color.fromCssColorString(ACCENT_COLOR)}
                 clampToGround={true}
               />
             </Entity>
           );
        }

        const position = Cartesian3.fromDegrees(
          poi.location.lng,
          poi.location.lat,
          poi.location.alt || 0
        );

        let image = markerImages.geocoded;
        if (poi.type === 'booking') image = markerImages.booking;
        if (poi.type === 'viewpoint') image = markerImages.viewpoint;

        return (
          <Entity
            key={poi.id}
            position={position}
            name={poi.name}
            description={poi.description}
            billboard={{
              image: image,
              verticalOrigin: VerticalOrigin.BOTTOM,
              heightReference: clampTo3DTiles ? HeightReference.CLAMP_TO_3D_TILE : HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            }}
            onClick={() => onPoiClick?.(position)}
          />
        );
      })}
    </>
  );
}
