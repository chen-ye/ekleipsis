import GlobeView from './components/GlobeView';
import Sidebar from './components/Sidebar';
import './App.css';
import { PoiProvider } from './contexts/PoiContext';

function App() {
  return (
    <PoiProvider>
      <div className="app-container">
        <Sidebar />
        <main className="globe-container">
          <GlobeView />
        </main>
      </div>
    </PoiProvider>
  );
}

export default App;
