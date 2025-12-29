import { Box } from '@radix-ui/themes';
import { Cartesian3 } from 'cesium';
import { useState } from 'react';
import GlobeView from './components/GlobeView';
import { MALLORCA_LAT, MALLORCA_LNG } from './constants/eclipse';
import { PoiProvider } from './contexts/PoiContext';

const MALLORCA_POSITION = Cartesian3.fromDegrees(
	MALLORCA_LNG,
	MALLORCA_LAT,
	20000,
);

function App() {
	const [cameraDestination, setCameraDestination] =
		useState<Cartesian3>(MALLORCA_POSITION);

	return (
		<PoiProvider>
			<Box style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
				<GlobeView
					cameraDestination={cameraDestination}
					onFlyTo={setCameraDestination}
				/>
			</Box>
		</PoiProvider>
	);
}

export default App;
