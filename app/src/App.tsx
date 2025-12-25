import { Flex, Box } from '@radix-ui/themes';
import GlobeView from './components/GlobeView';
import Sidebar from './components/Sidebar';
import { PoiProvider } from './contexts/PoiContext';

function App() {
  return (
    <PoiProvider>
      <Flex style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Sidebar />
        <Box flexGrow="1" position="relative">
          <GlobeView />
        </Box>
      </Flex>
    </PoiProvider>
  );
}

export default App;
