

export default defineContentScript({
  matches: ['*://*.airbnb.com/rooms/*'],
  async main(ctx) {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'EXTRACT_POI') {
        extractAirbnbData();
      }
    });
  },
});

function extractAirbnbData() {
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
    }).catch((err) => {
        console.error("Failed to copy:", err);
        console.log("Data:", data);
        alert("Failed to copy to clipboard (check console). Data extracted.");
    });
}
