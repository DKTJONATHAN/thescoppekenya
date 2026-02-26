import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;

const getCleanKey = () => {
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!rawKey) return undefined;

  return rawKey
    .replace(/^["']|["']$/g, '') // Remove wrapping quotes
    .split(String.raw`\n`)       // Split by literal \n string
    .join('\n')                  // Join with actual newlines
    .replace(/\\n/g, '\n');      // Final pass for any remaining escapes
};

const client = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: getCleanKey(),
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
    console.error("Auth Failure:", error.message);
    res.status(500).json({ 
      error: "Authentication failed", 
      details: error.message,
      // Helps us see if the key is at least loading into the variable
      key_length: process.env.GA4_PRIVATE_KEY?.length || 0 
    });
  }
}