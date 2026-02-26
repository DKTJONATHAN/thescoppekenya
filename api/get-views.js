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
      dateRanges: [{ startDate: '2025-01-01', endDate: 'today' }], // Ensure start date covers your site's life
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
    });

    const viewMap = {};
    if (response.rows) {
      response.rows.forEach((row) => {
        let path = row.dimensionValues[0].value;
        // Remove trailing slash if it exists so "/article/story/" becomes "/article/story"
        if (path.endsWith('/') && path.length > 1) {
          path = path.slice(0, -1);
        }
        const views = parseInt(row.metricValues[0].value);
        viewMap[path] = views;
      });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(viewMap);
  } catch (error) {
    console.error("GA4 Error:", error);
    res.status(500).json({ error: error.message });
  }
}