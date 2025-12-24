import { useRef, useState } from 'react';
import { usePoi } from '../contexts/PoiContext';
import { parseFile } from '../utils/fileParser';
import './Sidebar.css';

export default function Sidebar() {
  const { pois, addPoi, loading } = usePoi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      try {
        const parsedPois = await parseFile(file);
        for (const p of parsedPois) {
          await addPoi({
            ...p,
            createdAt: Date.now(),
            fileSource: file.name
          });
        }
      } catch (err) {
        console.error("Failed to parse file:", file.name, err);
        alert(`Failed to parse ${file.name}`);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await resp.json();
      if (data && data.length > 0) {
        const first = data[0];
        await addPoi({
          name: first.display_name.split(',')[0],
          description: first.display_name,
          type: 'geocoded',
          location: {
            lat: parseFloat(first.lat),
            lng: parseFloat(first.lon)
          },
          createdAt: Date.now()
        });
        setSearchQuery('');
      } else {
        alert('No results found');
      }
    } catch (e) {
      console.error("Geocoding failed", e);
      alert('Geocoding failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Ekleipsis</h1>
      </div>

      <div className="sidebar-actions">
        <div style={{ marginBottom: '10px', display: 'flex', gap: '5px' }}>
             <input
                type="text"
                placeholder="Search place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, padding: '4px' }}
             />
             <button onClick={handleSearch} disabled={searching} style={{ width: 'auto' }}>
                {searching ? '...' : 'Add'}
             </button>
        </div>

        <button onClick={() => fileInputRef.current?.click()}>
          Import POI/GPX
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".kml,.gpx,.json,.geojson"
          multiple
          onChange={handleFileUpload}
        />
      </div>

      <div className="sidebar-content">
        {loading ? (
            <p>Loading POIs...</p>
        ) : (
            <div className="poi-list">
                {pois.length === 0 && <p>No POIs yet. Import or add some!</p>}
                {pois.map(poi => (
                    <div key={poi.id} className="poi-item">
                        <strong>{poi.name}</strong>
                        <span className="poi-type">{poi.type}</span>
                        {poi.description && <p>{poi.description}</p>}
                    </div>
                ))}
            </div>
        )}
      </div>
    </aside>
  );
}
