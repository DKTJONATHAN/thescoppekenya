import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;

// "Safe" Key Formatter
const formatKey = (key) => {
  if (!key) return undefined;
  // Remove any stray quotes that Android or Vercel might have added
  const cleanKey = key.replace(/^["']|["']$/g, '');
  // Convert escaped \n into actual line breaks
  return cleanKey.replace(/\\n/g, '\n');
};

const client = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: formatKey(process.env.GA4_PRIVATE_KEY),
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

    // Cache for 1 hour to protect your GA4 limits
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(viewMap);
  } catch (error) {
    console.error("Detailed GA4 Error:", error);
    res.status(500).json({ 
        error: error.message, 
        hint: "Check if the Private Key starts with -----BEGIN PRIVATE KEY-----" 
    });
  }
}