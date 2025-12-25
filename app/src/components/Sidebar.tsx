import { useRef, useState } from 'react';
import { usePoi } from '../contexts/PoiContext';
import { parseFile } from '../utils/fileParser';
import { Flex, Box, Heading, TextField, Button, Card, Text, Badge } from '@radix-ui/themes';
import { Cartesian3 } from 'cesium';

interface SidebarProps {
    onPoiClick?: (destination: Cartesian3) => void;
}

export default function Sidebar({ onPoiClick }: SidebarProps) {
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

  const handlePoiCardClick = (poi: any) => {
    if (!onPoiClick) return;

    let destination: Cartesian3;
    if (poi.type === 'track' && poi.path && poi.path.length > 0) {
        const start = poi.path[0];
        destination = Cartesian3.fromDegrees(start.lng, start.lat, start.alt || 2000);
    } else {
        destination = Cartesian3.fromDegrees(poi.location.lng, poi.location.lat, poi.location.alt || 500);
    }
    onPoiClick(destination);
  };

  return (
    <Flex direction="column" style={{
        width: '360px',
        height: '100%',
        borderRight: '1px solid var(--gray-5)',
        backgroundColor: 'var(--color-panel-solid)',
        zIndex: 10
    }}>
      <Box p="4" style={{ borderBottom: '1px solid var(--gray-5)' }}>
        <Heading size="4">Ekleipsis</Heading>
      </Box>

      <Flex direction="column" gap="3" p="4" style={{ borderBottom: '1px solid var(--gray-5)' }}>
        <Flex gap="2">
             <Box flexGrow="1">
                <TextField.Root
                    placeholder="Search place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
             </Box>
             <Button onClick={handleSearch} disabled={searching} variant="solid">
                {searching ? '...' : 'Add'}
             </Button>
        </Flex>

        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          Import POI/GPX
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".kml,.gpx,.json,.geojson"
          multiple
          onChange={handleFileUpload}
        />
      </Flex>

      <Box flexGrow="1" p="4" style={{ overflowY: 'auto' }}>
        {loading ? (
            <Text color="gray">Loading POIs...</Text>
        ) : (
            <Flex direction="column" gap="3">
                {pois.length === 0 && <Text color="gray" size="2">No POIs yet. Import or add some!</Text>}
                {pois.map(poi => (
                    <Card key={poi.id} onClick={() => handlePoiCardClick(poi)} style={{ cursor: 'pointer' }}>
                        <Flex direction="column" gap="1">
                            <Text weight="bold" size="3">{poi.name}</Text>
                            <Badge color="gray" variant="surface" style={{ width: 'fit-content' }}>
                                {poi.type}
                            </Badge>
                            {poi.description && <Text size="2" color="gray">{poi.description}</Text>}
                        </Flex>
                    </Card>
                ))}
            </Flex>
        )}
      </Box>
    </Flex>
  );
}
