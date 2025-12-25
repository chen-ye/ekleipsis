import { Flex, Heading, Button, Container, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { auth } from '../../utils/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u: User | null) => {
        setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
      try {
          await signInWithPopup(auth, new GoogleAuthProvider());
      } catch (e) {
          console.error("Login failed", e);
      }
  };

  const handleLogout = async () => {
      await signOut(auth);
  };

  const handleExtract = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
       try {
           // Send message to background to handle extraction + saving?
           // Or content script extracts and sends back to background?
           // Current flow: Popup -> Content (EXTRACT) -> Content logic.
           // Content logic currently copies to clipboard.
           // We want Content logic to send data to background to SAVE.

           // So Popup just triggers CONTENT.
           await browser.tabs.sendMessage(tab.id, { action: 'EXTRACT_POI' });
           window.close();
       } catch (e) {
           console.error("Failed to send message:", e);
           alert("Could not trigger extraction. Refresh the page and try again.");
       }
    }
  };

  if (!user) {
      return (
        <Container size="1" p="4" style={{ width: 240 }}>
            <Flex direction="column" gap="4" align="center">
                <Heading size="3" align="center">Ekleipsis</Heading>
                <Text size="2" color="gray">Please login to save POIs</Text>
                <Button onClick={handleLogin} size="2">Login with Google</Button>
            </Flex>
        </Container>
      );
  }

  return (
    <Container size="1" p="4" style={{ width: 240 }}>
        <Flex direction="column" gap="4" align="center">
            <Heading size="3" align="center">Ekleipsis Extractor</Heading>
            <Text size="1" color="gray">Logged in as {user.email}</Text>

            <Button onClick={handleExtract} size="3" style={{ width: '100%' }}>
                <PlusIcon /> Add to Ekleipsis
            </Button>

            <Button onClick={handleLogout} variant="soft" color="gray" size="1">Log out</Button>
        </Flex>
    </Container>
  );
}

export default App;
