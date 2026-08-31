import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { KenyaWireBoard } from "@/components/news/KenyaWireEmbed";
import { KENYA_WIRE_OUTLETS } from "@/lib/kenya-wire";

const SITE_URL = "https://zandani.co.ke";

export default function LiveWirePage() {
  return (
    <Layout>
      <Helmet>
        <title>Kenya Wire | Live X feeds from Kenyan newsrooms | Za Ndani</title>
        <meta
          name="description"
          content="Live posts from Citizen TV, NTV, Nation, The Standard, K24, KBC and other Kenyan newsrooms, embedded from their official X accounts."
        />
        <link rel="canonical" href={`${SITE_URL}/live`} />
      </Helmet>
      <div className="bg-zinc-950 text-white min-h-screen">
        <section className="border-b border-zinc-800">
          <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-10 md:py-14">
            <div className="flex items-center gap-2 text-red-400 text-[11px] font-black uppercase tracking-[0.25em] mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              Live wire
            </div>
            <h1 className="font-serif font-black text-4xl md:text-6xl leading-[0.95] max-w-3xl">
              Kenyan newsrooms, posting now.
            </h1>
            <p className="text-zinc-400 max-w-2xl mt-4 text-base md:text-lg">
              Official X timelines from Citizen, NTV, Nation, The Standard and more. Tap a newsroom to load its live feed.
            </p>
          </div>
        </section>
        <section className="container max-w-7xl mx-auto px-3 sm:px-4 py-8 md:py-10">
          <KenyaWireBoard />
          <p className="text-xs text-zinc-500 mt-6">
            These feeds are embedded from each outlet’s official X account. Za Ndani does not edit or republish the posts.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {KENYA_WIRE_OUTLETS.map((outlet) => (
              <a
                key={outlet.handle}
                href={`https://x.com/${outlet.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-sky-400/60 transition-colors"
              >
                <p className="text-sm font-bold">{outlet.name}</p>
                <p className="text-xs text-zinc-500">@{outlet.handle}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
