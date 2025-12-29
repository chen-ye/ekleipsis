export interface GeoLocation {
	lat: number;
	lng: number;
	alt?: number;
}

export type PoiType =
	| 'imported_file'
	| 'geocoded'
	| 'booking'
	| 'viewpoint'
	| 'track';

export interface Poi {
	id: string;
	name: string;
	type: PoiType;
	location: GeoLocation; // For track, this can be the start point
	path?: GeoLocation[]; // For tracks
	description?: string;
	// Metadata for bookings (Airbnb/VRBO)
	bookingMetadata?: {
		price?: string;
		capacity?: string;
		pricePerPerson?: string;
		url?: string;
		source?: 'airbnb' | 'vrbo';
	};
	// Metadata for imported files
	fileSource?: string;
	userId?: string;
	userEmail?: string | null;
	createdAt: number;
}
