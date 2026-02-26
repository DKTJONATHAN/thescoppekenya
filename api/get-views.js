import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;
const client = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: process.env.GA4_PRIVATE_KEY.replace(/\\n/g, '\n'),
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

    // CACHE SETTINGS:
    // s-maxage=3600 means Vercel holds this for 1 hour.
    // stale-while-revalidate means if someone visits after 1 hour, 
    // they get the OLD data instantly while Vercel updates the NEW data in the background.
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    
    res.status(200).json(viewMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}