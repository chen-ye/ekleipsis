import { kml, gpx as toGeoJsonGpx } from '@tmcw/togeojson';
import type { Feature, FeatureCollection, Position } from 'geojson';
import type { GeoLocation, Poi } from '../types/poi';

export async function parseFile(
	file: File,
): Promise<Pick<Poi, 'name' | 'type' | 'location' | 'path' | 'description'>[]> {
	const text = await file.text();
	const lowerName = file.name.toLowerCase();

	if (lowerName.endsWith('.kml')) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'text/xml');
		const geojson = kml(doc);
		return parseGeoJson(geojson as FeatureCollection | Feature);
	} else if (lowerName.endsWith('.gpx')) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'text/xml');
		const geojson = toGeoJsonGpx(doc);
		return parseGeoJson(geojson as FeatureCollection | Feature);
	} else if (lowerName.endsWith('.json') || lowerName.endsWith('.geojson')) {
		const geojson = JSON.parse(text);
		return parseGeoJson(geojson as FeatureCollection | Feature);
	} else {
		throw new Error('Unsupported file format');
	}
}

function parseGeoJson(
	geojson: FeatureCollection | Feature,
): Pick<Poi, 'name' | 'type' | 'location' | 'path' | 'description'>[] {
	const pois: Pick<
		Poi,
		'name' | 'type' | 'location' | 'path' | 'description'
	>[] = [];

	const features: Feature[] =
		geojson.type === 'FeatureCollection'
			? (geojson as FeatureCollection).features
			: [geojson as Feature];

	for (const feature of features) {
		if (!feature.geometry) continue;

		const basePoi = {
			name: feature.properties?.name || 'Untitled',
			description: feature.properties?.description,
		};

		if (feature.geometry.type === 'Point') {
			const coords = (feature.geometry as { coordinates: Position })
				.coordinates;
			pois.push({
				...basePoi,
				type: 'imported_file',
				location: {
					lng: coords[0],
					lat: coords[1],
					alt: coords[2] || 0,
				},
			});
		} else if (feature.geometry.type === 'LineString') {
			const coords = (feature.geometry as { coordinates: Position[] })
				.coordinates;
			const path: GeoLocation[] = coords.map((c: Position) => ({
				lng: c[0],
				lat: c[1],
				alt: c[2] || 0,
			}));

			if (path.length > 0) {
				pois.push({
					...basePoi,
					type: 'track',
					location: path[0],
					path: path,
				});
			}
		}
	}
	return pois;
}
