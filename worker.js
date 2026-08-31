const GSC_HTML = "google-site-verification: google4a7d26b466f41330.html\n";
const GSC_TXT = "968a6d115d3240a3acbc3448c398978d\n";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/google4a7d26b466f41330.html" || path === "/google4a7d26b466f41330") {
      return new Response(GSC_HTML, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-robots-tag": "noindex",
        },
      });
    }

    if (path === "/968a6d115d3240a3acbc3448c398978d.txt") {
      return new Response(GSC_TXT, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-robots-tag": "noindex",
        },
      });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
