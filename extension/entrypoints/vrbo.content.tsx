import ReactDOM from 'react-dom/client';
import { ContentScriptContext } from 'wxt/client';
import './airbnb.css'; // Reuse styles or create new

export default defineContentScript({
  matches: ['*://*.vrbo.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createUi(ctx);
    ui.mount();
  },
});

function createUi(ctx: ContentScriptContext) {
  return createShadowRootUi(ctx, {
    name: 'ekleipsis-ui-vrbo',
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
        const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title;
        const description = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const url = window.location.href;

        // VRBO coordinates: Look for window.__INITIAL_STATE__ or generic schema.org
        // Schema.org script
        let lat = 0;
        let lng = 0;
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const s of scripts) {
            try {
                const json = JSON.parse(s.textContent || '{}');
                if (json.geo) {
                    lat = parseFloat(json.geo.latitude);
                    lng = parseFloat(json.geo.longitude);
                    break;
                }
                // Array of types?
            } catch (e) {}
        }

        const data = {
            id: 'vrbo-' + Date.now(),
            name: title,
            description: description,
            type: 'booking',
            location: { lat, lng },
            bookingMetadata: {
                url,
                source: 'vrbo'
            }
        };

        navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
            alert("Copied POI to clipboard! Paste it into Ekleipsis.");
        }).catch(() => {
             console.log("Data:", data);
             alert("Failed to copy. Check console.");
        });
    };

    return (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99999 }}>
            <button
                onClick={handleExtract}
                style={{
                    padding: '12px 20px',
                    background: '#2a6ebb', // VRBO blue
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
