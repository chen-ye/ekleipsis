import { kml, gpx as toGeoJsonGpx } from '@tmcw/togeojson';
import type { GeoLocation, Poi } from '../types/poi';

// Helper to parse file
export async function parseFile(
	file: File,
): Promise<Pick<Poi, 'name' | 'type' | 'location' | 'path' | 'description'>[]> {
	const text = await file.text();
	const lowerName = file.name.toLowerCase();

	if (lowerName.endsWith('.kml')) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'text/xml');
		const geojson = kml(doc);
		return parseGeoJson(geojson);
	} else if (lowerName.endsWith('.gpx')) {
		// Using gpxparser for metadata if needed, but togeojson is standard for geometry
		// Let's use togeojson for geometry
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'text/xml');
		const geojson = toGeoJsonGpx(doc);
		return parseGeoJson(geojson);
	} else if (lowerName.endsWith('.json') || lowerName.endsWith('.geojson')) {
		const geojson = JSON.parse(text);
		return parseGeoJson(geojson);
	} else {
		throw new Error('Unsupported file format');
	}
}

function parseGeoJson(geojson: any): any[] {
	const pois: any[] = [];

	const features =
		geojson.type === 'FeatureCollection' ? geojson.features : [geojson];

	for (const feature of features) {
		if (!feature.geometry) continue;

		const basePoi = {
			name: feature.properties?.name || 'Untitled',
			description: feature.properties?.description,
		};

		if (feature.geometry.type === 'Point') {
			pois.push({
				...basePoi,
				type: 'imported_file',
				location: {
					lng: feature.geometry.coordinates[0],
					lat: feature.geometry.coordinates[1],
					alt: feature.geometry.coordinates[2] || 0,
				},
			});
		} else if (feature.geometry.type === 'LineString') {
			const path: GeoLocation[] = feature.geometry.coordinates.map(
				(c: number[]) => ({
					lng: c[0],
					lat: c[1],
					alt: c[2] || 0,
				}),
			);
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
