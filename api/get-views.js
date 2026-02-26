import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;

// The Ultimate Fix: Decoding Base64 AND fixing the literal newlines
const getPrivateKey = () => {
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!rawKey) return undefined;

  try {
    // 1. Decode the Base64 string back into readable text
    let decodedKey = Buffer.from(rawKey.trim(), 'base64').toString('utf8');
    
    // 2. The JSON copy/paste encoded literal "\" and "n" characters.
    // We MUST convert the text "\n" back into real, invisible line breaks.
    decodedKey = decodedKey.replace(/\\n/g, '\n');
    
    // 3. Remove any quotes that might have been encoded by mistake from the JSON
    decodedKey = decodedKey.replace(/^["']|["']$/g, '');
    
    return decodedKey.trim();
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
    console.error("GA4 Error:", error.message);
    res.status(500).json({ 
      error: "Authentication failed", 
      details: error.message,
      debug: {
        success: false,
        hint: "If you still see DECODER routines::unsupported, the Base64 string is corrupted."
      }
    });
  }
}