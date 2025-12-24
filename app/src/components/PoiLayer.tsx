import { Entity, PolylineGraphics } from 'resium';
import { Cartesian3, Color, HeightReference } from 'cesium';
import { usePoi } from '../contexts/PoiContext';

export default function PoiLayer() {
  const { pois } = usePoi();

  if (!pois || pois.length === 0) return null;

  return (
    <>
      {pois.map((poi) => {
        // Simple visualization for Points:
        // Using Entity with point for now.
        // Location needs to include height or clamp to ground.
        // We assume lat/lon, default height 0 if not provided.
        // ClampToGround is done via heightReference?

        if (poi.type === 'track' && poi.path) {
           const positions = poi.path.map(p => Cartesian3.fromDegrees(p.lng, p.lat, p.alt || 0));
           return (
             <Entity key={poi.id} name={poi.name} description={poi.description}>
               <PolylineGraphics
                 positions={positions}
                 width={4}
                 material={Color.YELLOW}
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

        let color = Color.CYAN;
        if (poi.type === 'booking') color = Color.ORANGE;
        if (poi.type === 'viewpoint') color = Color.PURPLE;
        if (poi.type === 'geocoded') color = Color.RED;

        return (
          <Entity
            key={poi.id}
            position={position}
            name={poi.name}
            description={poi.description}
            point={{
              pixelSize: 10,
              color: color,
              outlineColor: Color.WHITE,
              outlineWidth: 2,
              heightReference: HeightReference.CLAMP_TO_GROUND
            }}
          />
        );
      })}
    </>
  );
}
