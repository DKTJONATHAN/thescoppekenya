// api/get-views.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA4_PROPERTY_ID;

const getPrivateKey = () => {
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!rawKey) return undefined;
  try {
    let decoded = Buffer.from(rawKey.trim(), 'base64').toString('utf8');
    decoded = decoded.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
    return decoded.trim();
  } catch {
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
  // If ?bust=1 is present (admin refresh button), skip all caches
  const forceFresh = req.query.bust === '1';

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '2026-01-01', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      limit: 1000,
    });

    const viewMap: Record<string, number> = {};
    if (response.rows) {
      response.rows.forEach((row) => {
        let path = row.dimensionValues?.[0]?.value ?? '';
        if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);
        const views = parseInt(row.metricValues?.[0]?.value ?? '0', 10);
        if (!isNaN(views)) viewMap[path] = views;
      });
    }

    // Force-refresh from admin bypasses Vercel CDN cache entirely
    // Normal requests are cached for 1 hour at the edge
    res.setHeader(
      'Cache-Control',
      forceFresh
        ? 'no-store'
        : 'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.status(200).json(viewMap);

  } catch (error: any) {
    console.error('GA4 Error:', error.message);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json({});
  }
}
