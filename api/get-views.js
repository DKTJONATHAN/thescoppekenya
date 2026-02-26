import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;

// Decode the Base64 string back into a pristine RSA Key
const getPrivateKey = () => {
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!rawKey) return undefined;

  try {
    // Decode Base64 to utf8 string
    return Buffer.from(rawKey.trim(), 'base64').toString('utf8');
  } catch (error) {
    return undefined;
  }
};

const client = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: getPrivateKey(),
  },
});

export default async function handler(req, res) {
  const keyLength = process.env.GA4_PRIVATE_KEY?.length || 0;

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '2026-01-01', endDate: 'today' }],
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
    res.status(500).json({ 
      error: "Authentication failed", 
      details: error.message,
      debug: {
        base64_length_in_vercel: keyLength,
        hint: keyLength < 2000 ? "Your Base64 string was truncated! It needs to be ~2300 characters." : "Key length is good, check format."
      }
    });
  }
}