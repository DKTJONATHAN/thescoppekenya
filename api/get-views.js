import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;

// Helper to fix the key format
const getPrivateKey = () => {
  const key = process.env.GA4_PRIVATE_KEY;
  if (!key) return undefined;
  // Handles both escaped and literal newlines
  return key.replace(/\\n/g, '\n');
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
    // This will help you see the exact error in Vercel logs if it fails again
    console.error("Detailed GA4 Error:", error);
    res.status(500).json({ error: error.message, code: error.code });
  }
}