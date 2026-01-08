import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IndexNowRequest {
  urls: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("INDEXNOW_API_KEY");
    
    if (!apiKey) {
      console.error("INDEXNOW_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "IndexNow API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { urls }: IndexNowRequest = await req.json();

    if (!urls || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "No URLs provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const host = "thescoopkenya.co.ke";
    const keyLocation = `https://${host}/${apiKey}.txt`;

    console.log(`Submitting ${urls.length} URLs to IndexNow:`, urls);

    // Submit to IndexNow API (supports multiple search engines)
    const indexNowPayload = {
      host,
      key: apiKey,
      keyLocation,
      urlList: urls.map(url => url.startsWith('http') ? url : `https://${host}${url}`)
    };

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(indexNowPayload)
    });

    const status = response.status;
    console.log(`IndexNow API response status: ${status}`);

    if (status === 200 || status === 202) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully submitted ${urls.length} URL(s) to IndexNow`,
          submittedUrls: indexNowPayload.urlList
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      const errorText = await response.text();
      console.error(`IndexNow API error: ${status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `IndexNow API returned status ${status}`, details: errorText }),
        { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in index-now function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
