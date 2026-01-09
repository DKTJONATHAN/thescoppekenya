import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOOTBALL_API_BASE = 'https://api.football-data.org/v4';

// Supported competitions (free tier)
const COMPETITIONS = {
  PL: 'Premier League',
  PD: 'La Liga',
  SA: 'Serie A',
  BL1: 'Bundesliga',
  FL1: 'Ligue 1',
  CL: 'Champions League',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FOOTBALL_DATA_API_KEY = Deno.env.get('FOOTBALL_DATA_API_KEY');
    if (!FOOTBALL_DATA_API_KEY) {
      throw new Error('FOOTBALL_DATA_API_KEY is not configured');
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const competition = url.searchParams.get('competition') || 'PL';
    const matchId = url.searchParams.get('matchId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    let apiUrl = '';
    
    switch (endpoint) {
      case 'matches':
        // Get today's matches across all competitions or specific competition
        if (competition === 'ALL') {
          apiUrl = `${FOOTBALL_API_BASE}/matches`;
        } else {
          apiUrl = `${FOOTBALL_API_BASE}/competitions/${competition}/matches`;
        }
        if (dateFrom && dateTo) {
          apiUrl += `?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        }
        break;
        
      case 'standings':
        apiUrl = `${FOOTBALL_API_BASE}/competitions/${competition}/standings`;
        break;
        
      case 'match':
        if (!matchId) {
          throw new Error('matchId is required for match endpoint');
        }
        apiUrl = `${FOOTBALL_API_BASE}/matches/${matchId}`;
        break;
        
      case 'competition':
        apiUrl = `${FOOTBALL_API_BASE}/competitions/${competition}`;
        break;
        
      case 'scorers':
        apiUrl = `${FOOTBALL_API_BASE}/competitions/${competition}/scorers`;
        break;
        
      default:
        // Default to today's matches
        apiUrl = `${FOOTBALL_API_BASE}/matches`;
    }

    console.log(`Fetching from Football-Data.org: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'X-Auth-Token': FOOTBALL_DATA_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Football API error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Football API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        data,
        competitions: COMPETITIONS,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Football data error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
