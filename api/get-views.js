import { BetaAnalyticsDataClient } from '@google-analytics/data';

// These come from the Vercel secrets you added earlier
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
      dateRanges: [{ startDate: '2024-01-01', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
    });

    const viewMap = {};
    response.rows.forEach((row) => {
      const path = row.dimensionValues[0].value;
      const views = parseInt(row.metricValues[0].value);
      viewMap[path] = views;
    });

    // Cache the data for 1 hour so it's fast
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(viewMap);
  } catch (error) {
    console.error("GA4 Error:", error);
    res.status(500).json({ error: "Failed to fetch views" });
  }
}