import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;

// This function "repairs" the key for Vercel's environment
const getCleanKey = (key) => {
  if (!key) return undefined;
  // 1. Remove wrapping quotes if present
  let cleanKey = key.replace(/^["']|["']$/g, '');
  // 2. Convert literal "\n" strings into actual line breaks
  cleanKey = cleanKey.replace(/\\n/g, '\n');
  return cleanKey.trim();
};

const client = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: getCleanKey(process.env.GA4_PRIVATE_KEY),
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

    // Set high cache to protect your high traffic
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(viewMap);
  } catch (error) {
    console.error("GA4 Auth Error:", error.message);
    res.status(500).json({ 
      error: "Authentication failed. Check your Private Key format.",
      details: error.message 
    });
  }
}