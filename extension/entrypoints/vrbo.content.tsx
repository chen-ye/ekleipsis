

export default defineContentScript({
  matches: ['*://*.vrbo.com/*'],
  async main(ctx) {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'EXTRACT_POI') {
        extractVrboData();
      }
    });
  },
});

function extractVrboData() {
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
    }).catch((err) => {
         console.error("Failed to copy:", err);
         console.log("Data:", data);
         alert("Failed to copy. Check console.");
    });
}
