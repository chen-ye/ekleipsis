import { Flex, Box } from '@radix-ui/themes';
import GlobeView from './components/GlobeView';
import Sidebar from './components/Sidebar';
import { PoiProvider } from './contexts/PoiContext';
import { useState } from 'react';
import { Cartesian3 } from 'cesium';
import { MALLORCA_LAT, MALLORCA_LNG } from './constants/eclipse';

const MALLORCA_POSITION = Cartesian3.fromDegrees(MALLORCA_LNG, MALLORCA_LAT, 20000);

function App() {
  const [cameraDestination, setCameraDestination] = useState<Cartesian3>(MALLORCA_POSITION);

  return (
    <PoiProvider>
      <Flex style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Sidebar onPoiClick={setCameraDestination} />
        <Box flexGrow="1" position="relative">
          <GlobeView
            cameraDestination={cameraDestination}
            onFlyTo={setCameraDestination}
          />
        </Box>
      </Flex>
    </PoiProvider>
  );
}

export default App;
