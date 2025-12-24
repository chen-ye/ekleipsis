import ReactDOM from 'react-dom/client';
import { ContentScriptContext } from 'wxt/client';
import './airbnb.css';

export default defineContentScript({
  matches: ['*://*.airbnb.com/rooms/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createUi(ctx);
    ui.mount();
  },
});

function createUi(ctx: ContentScriptContext) {
  return createShadowRootUi(ctx, {
    name: 'ekleipsis-ui',
    position: 'inline',
    onMount: (uiContainer) => {
      const root = ReactDOM.createRoot(uiContainer);
      root.render(
        <AddToEkleipsisBtn />
      );
      return root;
    },
    onRemove: (root) => {
        root?.unmount();
    }
  });
}

function AddToEkleipsisBtn() {
    const handleExtract = () => {
        // Simple extraction logic
        // 1. Try to find meta tags
        const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title;
        const description = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const url = window.location.href;

        // Coordinates: Airbnb is tricky. They separate map data.
        // Look for internal script data `data-application="airbnb"` or similar.
        // Fallback: Use address text and geocode later?
        // Or look for `BootstrapData`.

        let lat = 0;
        let lng = 0;

        // Try searching scripts for "latitude": and "longitude":
        const scripts = document.querySelectorAll('script');
        for (const s of scripts) {
            const text = s.textContent || '';
            if (text.includes('"latitude":') && text.includes('"longitude":')) {
                const latMatch = text.match(/"latitude":\s*([-+]?\d*\.?\d+)/);
                const lngMatch = text.match(/"longitude":\s*([-+]?\d*\.?\d+)/);
                if (latMatch && lngMatch) {
                    lat = parseFloat(latMatch[1]);
                    lng = parseFloat(lngMatch[1]);
                    break;
                }
            }
        }

        const data = {
            id: 'airbnb-' + Date.now(), // temp id
            name: title,
            description: description,
            type: 'booking',
            location: { lat, lng },
            bookingMetadata: {
                url,
                source: 'airbnb'
            }
        };

        // Copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
            alert("Copied POI to clipboard! Paste it into Ekleipsis.");
        }).catch(() => {
            console.log("Data:", data);
            alert("Failed to copy. Check console for data.");
        });
    };

    return (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99999 }}>
            <button
                onClick={handleExtract}
                style={{
                    padding: '12px 20px',
                    background: '#ff385c', // Airbnb red-ish
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    cursor: 'pointer'
                }}
            >
                Add to Ekleipsis
            </button>
        </div>
    );
}
