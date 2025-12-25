import { useRef, useState, useEffect } from 'react';
import { usePoi } from '../contexts/PoiContext';
import { parseFile } from '../utils/fileParser';
import { Flex, Box, Heading, TextField, Button, RadioCards, Text, Badge, Avatar, DropdownMenu, IconButton, Dialog, AlertDialog } from '@radix-ui/themes';
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import { Cartesian3 } from 'cesium';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';

interface SidebarProps {
    onPoiClick?: (destination: Cartesian3) => void;
}

export default function Sidebar({ onPoiClick }: SidebarProps) {
  const { pois, addPoi, updatePoi, deletePoi, loading } = usePoi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [editingPoi, setEditingPoi] = useState<{ id: string; name: string } | null>(null);
  const [selectedPoiId, setSelectedPoiId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
      try {
          await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (e) {
          console.error("Login failed", e);
          alert("Login failed");
      }
  };

  const handleLogout = async () => {
      await signOut(auth);
  };

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
        maxHeight: 'calc(100vh - 80px)',
        background: 'var(--color-panel-translucent)',
        backdropFilter: 'blur(16px)',
        borderRadius: 'var(--radius-4)',
        border: '1px solid var(--gray-a4)',
        zIndex: 10,
        overflow: 'hidden',
    }}>
      <Box p="4" style={{ borderBottom: '1px solid var(--gray-a4)' }}>
        <Flex justify="between" align="center">
            <Heading size="4">Ekleipsis</Heading>
            {user ? (
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        <Avatar
                            src={user.photoURL || undefined}
                            fallback={user.email?.[0] || 'U'}
                            radius="full"
                            size="2"
                            style={{ cursor: 'pointer' }}
                        />
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                        <DropdownMenu.Label>{user.displayName || user.email}</DropdownMenu.Label>
                        <DropdownMenu.Item color="red" onClick={handleLogout}>
                            Log out
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            ) : (
                <Button size="1" variant="soft" onClick={handleLogin}>Log in</Button>
            )}
        </Flex>
      </Box>

      <Flex direction="column" gap="3" p="4" style={{ borderBottom: '1px solid var(--gray-5)' }}>
        <Flex gap="2">
             <Box flexGrow="1">
                <TextField.Root
                    placeholder={user ? "Search place..." : "Login to add places"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && user && handleSearch()}
                    disabled={!user}
                />
             </Box>
             <Button onClick={handleSearch} disabled={searching || !user} variant="solid">
                {searching ? '...' : 'Add'}
             </Button>
        </Flex>

        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!user}>
          Import POI/GPX
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".kml,.gpx,.json,.geojson"
          multiple
          onChange={handleFileUpload}
          disabled={!user}
        />
      </Flex>

      <Box flexGrow="1" p="4" style={{ overflowY: 'auto' }}>
        {loading ? (
            <Text color="gray">Loading POIs...</Text>
        ) : (
            <RadioCards.Root
                columns="1"
                gap="3"
                value={selectedPoiId}
                onValueChange={(value) => {
                    setSelectedPoiId(value);
                    const poi = pois.find(p => p.id === value);
                    if (poi) handlePoiCardClick(poi);
                }}
            >
                {pois.length === 0 && <Text color="gray" size="2">No POIs yet. Import or add some!</Text>}
                {pois.map(poi => (
                    <RadioCards.Item key={poi.id} value={poi.id}>
                        <Flex justify="between" align="start" gap="2" width="100%">
                            <Box flexGrow="1">
                                <Flex direction="column" gap="1">
                                    <Text weight="bold" size="3">{poi.name}</Text>
                                    <Badge color="gray" variant="surface" style={{ width: 'fit-content' }}>
                                        {poi.type}
                                    </Badge>
                                    {poi.description && <Text size="2" color="gray">{poi.description}</Text>}
                                </Flex>
                            </Box>
                            {user && (
                                <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                                    <Flex gap="3">
                                        <Dialog.Root open={editingPoi?.id === poi.id} onOpenChange={(open) => !open && setEditingPoi(null)}>
                                            <Dialog.Trigger>
                                                <IconButton size="1" variant="ghost" onClick={() => setEditingPoi({ id: poi.id, name: poi.name })}>
                                                    <Pencil1Icon />
                                                </IconButton>
                                            </Dialog.Trigger>
                                            <Dialog.Content maxWidth="400px">
                                                <Dialog.Title>Rename POI</Dialog.Title>
                                                <Dialog.Description size="2" mb="4">Enter a new name for this POI.</Dialog.Description>
                                                <TextField.Root
                                                    value={editingPoi?.name || ''}
                                                    onChange={(e) => setEditingPoi(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                />
                                                <Flex gap="3" mt="4" justify="end">
                                                    <Dialog.Close>
                                                        <Button variant="soft" color="gray">Cancel</Button>
                                                    </Dialog.Close>
                                                    <Dialog.Close>
                                                        <Button onClick={() => editingPoi && updatePoi(editingPoi.id, { name: editingPoi.name })}>Save</Button>
                                                    </Dialog.Close>
                                                </Flex>
                                            </Dialog.Content>
                                        </Dialog.Root>

                                        <AlertDialog.Root>
                                            <AlertDialog.Trigger>
                                                <IconButton size="1" variant="ghost" color="red">
                                                    <TrashIcon />
                                                </IconButton>
                                            </AlertDialog.Trigger>
                                            <AlertDialog.Content maxWidth="400px">
                                                <AlertDialog.Title>Delete POI</AlertDialog.Title>
                                                <AlertDialog.Description size="2">Are you sure you want to delete "{poi.name}"?</AlertDialog.Description>
                                                <Flex gap="3" mt="4" justify="end">
                                                    <AlertDialog.Cancel>
                                                        <Button variant="soft" color="gray">Cancel</Button>
                                                    </AlertDialog.Cancel>
                                                    <AlertDialog.Action>
                                                        <Button color="red" onClick={() => deletePoi(poi.id)}>Delete</Button>
                                                    </AlertDialog.Action>
                                                </Flex>
                                            </AlertDialog.Content>
                                        </AlertDialog.Root>
                                    </Flex>
                                </div>
                            )}
                        </Flex>
                    </RadioCards.Item>
                ))}
            </RadioCards.Root>
        )}
      </Box>
    </Flex>
  );
}
