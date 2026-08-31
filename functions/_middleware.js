const GSC_HTML_TOKEN = "google-site-verification: google4a7d26b466f41330.html\n";
const GSC_TXT_TOKEN = "968a6d115d3240a3acbc3448c398978d\n";

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);

  if (
    pathname === "/google4a7d26b466f41330.html" ||
    pathname === "/google4a7d26b466f41330"
  ) {
    return new Response(GSC_HTML_TOKEN, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
        "x-robots-tag": "noindex",
      },
    });
  }

  if (pathname === "/968a6d115d3240a3acbc3448c398978d.txt") {
    return new Response(GSC_TXT_TOKEN, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=300",
        "x-robots-tag": "noindex",
      },
    });
  }

  return context.next();
}
