import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;

// The "Ultimate Fix": Decoding from Base64
const getPrivateKey = () => {
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!rawKey) return undefined;

  try {
    // If it looks like Base64 (no BEGIN header), decode it
    if (!rawKey.includes('BEGIN PRIVATE KEY')) {
      return Buffer.from(rawKey, 'base64').toString('utf8');
    }
    // Fallback for standard format
    return rawKey.replace(/\\n/g, '\n');
  } catch (e) {
    return rawKey;
  }
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
      error: "Authentication failed", 
      details: error.message,
      // Helps verify if the decoding worked
      is_base64_attempt: !process.env.GA4_PRIVATE_KEY?.includes('BEGIN')
    });
  }
}