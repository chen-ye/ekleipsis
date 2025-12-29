import { Cross2Icon, ListBulletIcon, MagnifyingGlassIcon, Pencil1Icon, PlusIcon, StackIcon, TrashIcon, UploadIcon } from '@radix-ui/react-icons';
import { AlertDialog, Badge, Box, Button, Dialog, Flex, Heading, IconButton, Popover, RadioCards, SegmentedControl, Select, Switch, Text, TextField } from '@radix-ui/themes';
import { Cartesian3 } from 'cesium';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { usePoi } from '../contexts/PoiContext';
import { auth } from '../firebase';
import type { Poi, PoiType } from '../types/poi';
import { parseFile } from '../utils/fileParser';
import { ActionIconButton } from './common/ActionIconButton';
import { GlassPanel } from './common/GlassPanel';
import { LoginWidget } from './common/LoginWidget';

interface SidebarProps {
    onPoiClick?: (destination: Cartesian3) => void;
    show3DTiles?: boolean;
    setShow3DTiles?: (show: boolean) => void;
    showHeatmap?: boolean;
    setShowHeatmap?: (show: boolean) => void;
}

export default function Sidebar({ onPoiClick, show3DTiles, setShow3DTiles, showHeatmap, setShowHeatmap }: SidebarProps) {

  const { pois, addPoi, updatePoi, deletePoi, loading } = usePoi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [editingPoi, setEditingPoi] = useState<{ id: string; name: string; type: PoiType } | null>(null);
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

  const handlePoiCardClick = (poi: Poi) => {
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

  const DesktopSidebar = (
    <GlassPanel
        style={{
            width: '360px',
            maxHeight: 'calc(100vh - 80px)',
            zIndex: 10,
            overflow: 'hidden',
            padding: 0 // Override default if any, we want inner structure
        }}
    >
      <Box p="4" style={{ borderBottom: '1px solid var(--gray-a4)' }}>
        <Flex justify="between" align="center">
            <Heading size="4">Ekleipsis</Heading>
            <LoginWidget user={user} onLogin={handleLogin} onLogout={handleLogout} />
        </Flex>
      </Box>

      <Flex direction="column" gap="3" p="4" style={{ borderBottom: '1px solid var(--gray-5)' }}>
        <Flex gap="2" align="center">
             <Box flexGrow="1">
                <TextField.Root
                    placeholder={user ? "Search place..." : "Login to add places"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && user && handleSearch()}
                    disabled={!user}
                >
                    <TextField.Slot>
                        <MagnifyingGlassIcon height="16" width="16" />
                    </TextField.Slot>
                    <TextField.Slot>
                        <IconButton size="1" variant="ghost" onClick={handleSearch} disabled={searching || !user}>
                             <PlusIcon height="16" width="16" />
                        </IconButton>
                    </TextField.Slot>
                </TextField.Root>
             </Box>
             <IconButton variant="surface" onClick={() => fileInputRef.current?.click()} disabled={!user}>
                <UploadIcon width="18" height="18" />
             </IconButton>
        </Flex>

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
        {renderPoiList()}
      </Box>
    </GlassPanel>
  );

  const MobileSidebar = (
    <Flex direction="column" gap="2" display={{ initial: 'flex', sm: 'none' }} style={{
        position: 'absolute',
        top: 20,
        left: 10,
        right: 10,
        zIndex: 10,
        pointerEvents: 'none' // Allow clicking through to map
    }}>
        {/* Row 1: POI Toggle + Search */}
        <Flex gap="2" style={{ pointerEvents: 'auto' }}>
             <Popover.Root>
                <Popover.Trigger>
                    <ActionIconButton>
                        <ListBulletIcon width="18" height="18" />
                    </ActionIconButton>
                </Popover.Trigger>
                <Popover.Content style={{ padding: 0, background: 'transparent', boxShadow: 'none', border: 'none' }} width="300px">
                    <GlassPanel style={{ maxHeight: '50vh', overflowY: 'auto', padding: 'var(--space-3)' }}>
                        <Flex justify="between" align="center" mb="2">
                            <Text size="2" weight="medium" color="gray">Points of Interest</Text>
                            <Popover.Close>
                                <IconButton variant="ghost" size="1" color="gray"><Cross2Icon /></IconButton>
                            </Popover.Close>
                        </Flex>
                        {renderPoiList()}
                    </GlassPanel>
                </Popover.Content>
             </Popover.Root>

             <Box flexGrow="1">
                 <TextField.Root
                    size="3"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && user && handleSearch()}
                    disabled={!user}
                    style={{
                        background: 'var(--color-panel-translucent)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid var(--gray-a4)',
                        boxShadow: 'none'
                        // Kept inline style because TextField doesn't easily compose with GlassPanel
                    }}
                >
                    <TextField.Slot>
                        <MagnifyingGlassIcon height="16" width="16" />
                    </TextField.Slot>
                    <TextField.Slot>
                        <IconButton size="1" variant="ghost" onClick={handleSearch} disabled={searching || !user}>
                             <PlusIcon height="16" width="16" />
                        </IconButton>
                    </TextField.Slot>
                </TextField.Root>
             </Box>

             {/* Import Button (Icon) */}
             <ActionIconButton onClick={() => fileInputRef.current?.click()} disabled={!user}>
                <UploadIcon width="18" height="18" />
             </ActionIconButton>
        </Flex>

        {/* Row 2: Login + Layers */}
        <Flex justify="between" align="center" style={{ pointerEvents: 'auto' }}>
            {/* Login Widget */}
            <LoginWidget user={user} onLogin={handleLogin} onLogout={handleLogout} />

            {/* Layers Toggle */}
            <Popover.Root>
                <Popover.Trigger>
                     <ActionIconButton>
                        <StackIcon width="18" height="18" />
                    </ActionIconButton>
                </Popover.Trigger>
                <Popover.Content style={{ padding: 0, background: 'transparent', boxShadow: 'none', border: 'none' }} width="280px">
                    <GlassPanel style={{ padding: 'var(--space-3)' }}>
                        <Flex direction="column" gap="3">
                            <Text size="2" weight="medium" color="gray">Map Layers</Text>
                            <Flex direction="column" gap="2">
                                 <SegmentedControl.Root
                                    value={show3DTiles ? 'google' : 'cesium'}
                                    onValueChange={(val) => setShow3DTiles?.(val === 'google')}
                                    radius="full"
                                >
                                    <SegmentedControl.Item value="google">Google 3D</SegmentedControl.Item>
                                    <SegmentedControl.Item value="cesium">Cesium World</SegmentedControl.Item>
                                </SegmentedControl.Root>

                                 <Flex justify="between" align="center">
                                    <Text size="2">Strava Heatmap</Text>
                                    <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} />
                                </Flex>
                            </Flex>
                        </Flex>
                    </GlassPanel>
                </Popover.Content>
            </Popover.Root>
        </Flex>
    </Flex>
  );

  function renderPoiList() {
    return (
        <>
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
                                    // biome-ignore lint/a11y/noStaticElementInteractions: suppresses bubbling
                                    // biome-ignore lint/a11y/useKeyWithClickEvents: suppresses bubbling
                                    <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                                        <Flex gap="3">
                                            <Dialog.Root open={editingPoi?.id === poi.id} onOpenChange={(open) => !open && setEditingPoi(null)}>
                                                <Dialog.Trigger>
                                                    <IconButton size="1" variant="ghost" onClick={() => setEditingPoi({ id: poi.id, name: poi.name, type: poi.type })}>
                                                        <Pencil1Icon />
                                                    </IconButton>
                                                </Dialog.Trigger>
                                                <Dialog.Content maxWidth="400px">
                                                    <Dialog.Title>Edit POI</Dialog.Title>
                                                    <TextField.Root
                                                        placeholder="Name"
                                                        value={editingPoi?.name || ''}
                                                        onChange={(e) => setEditingPoi(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                    />

                                                    <Box mt="3">
                                                        <Text as="div" size="2" mb="2" weight="bold">Type</Text>
                                                        <Select.Root
                                                            value={editingPoi?.type}
                                                            onValueChange={(val) => setEditingPoi(prev => prev ? { ...prev, type: val as PoiType } : null)}
                                                        >
                                                            <Select.Trigger />
                                                            <Select.Content>
                                                                <Select.Item value="geocoded">geocoded</Select.Item>
                                                                <Select.Item value="viewpoint">viewpoint</Select.Item>
                                                                <Select.Item value="booking">booking</Select.Item>
                                                                <Select.Item value="track">track</Select.Item>
                                                                <Select.Item value="imported_file">imported_file</Select.Item>
                                                            </Select.Content>
                                                        </Select.Root>
                                                    </Box>
                                                    <Flex gap="3" mt="4" justify="end">
                                                        <Dialog.Close>
                                                            <Button variant="soft" color="gray">Cancel</Button>
                                                        </Dialog.Close>
                                                        <Dialog.Close>
                                                            <Button onClick={() => editingPoi && updatePoi(editingPoi.id, { name: editingPoi.name, type: editingPoi.type })}>Save</Button>
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
        </>
    );
  }

  return (
    <>
        {/* Absolute positioned Desktop Sidebar */}
        <Box style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 100,
        }} display={{ initial: 'none', sm: 'block' }}>
            {DesktopSidebar}
        </Box>
        {MobileSidebar}
    </>
  );
}
