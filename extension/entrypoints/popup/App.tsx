import { Flex, Heading, Button, Container } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';

function App() {
  const handleExtract = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
       try {
           await browser.tabs.sendMessage(tab.id, { action: 'EXTRACT_POI' });
           window.close();
       } catch (e) {
           console.error("Failed to send message:", e);
           alert("Could not trigger extraction. Refresh the page and try again.");
       }
    }
  };

  return (
    <Container size="1" p="4" style={{ width: 240 }}>
        <Flex direction="column" gap="4" align="center">
            <Heading size="3" align="center">Ekleipsis Extractor</Heading>
            <Button onClick={handleExtract} size="3" style={{ width: '100%' }}>
                <PlusIcon /> Add to Ekleipsis
            </Button>
        </Flex>
    </Container>
  );
}

export default App;
