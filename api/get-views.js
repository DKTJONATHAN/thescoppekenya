import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;

// The most robust way to fix the Vercel/Node key issue
const getPrivateKey = () => {
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!rawKey) return undefined;

  // 1. Remove any wrapping quotes (common on Android/Vercel)
  let key = rawKey.replace(/^["']|["']$/g, '');

  // 2. If the key already has literal newlines, it's fine. 
  // If it has "\n" characters, we convert them.
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }

  // 3. Final check: Ensure the header/footer are on their own lines
  if (!key.includes('\n')) {
    // This is a "flat" key, we must add the breaks manually for the decoder
    key = key.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
             .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  }

  return key;
};

const client = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: getPrivateKey(),
  },
});

export default async function handler(req, res) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '2025-01-01', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
    });

    const viewMap = {};
    if (response.rows) {
      response.rows.forEach((row) => {
        let path = row.dimensionValues[0].value;
        if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);
        viewMap[path] = parseInt(row.metricValues[0].value);
      });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(viewMap);
  } catch (error) {
    console.error("GA4 Error:", error.message);
    res.status(500).json({ 
      error: "Final attempt at key fix failed.",
      details: error.message,
      // This will help us see if the key is even loading
      key_present: !!process.env.GA4_PRIVATE_KEY 
    });
  }
}