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
          content="Watch live posts from Citizen TV, NTV, Nation, The Standard, K24, KBC and other Kenyan newsrooms, embedded from their official X accounts."
        />
        <link rel="canonical" href={`${SITE_URL}/live`} />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <section className="container max-w-5xl mx-auto px-3 sm:px-4 py-8 md:py-12">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-2">Live</p>
        <h1 className="font-serif font-black text-3xl md:text-5xl leading-tight mb-3">Kenya Wire</h1>
        <p className="text-muted-foreground max-w-2xl mb-8">
          Official X timelines from major Kenyan newsrooms. Switch outlets with the tabs. Content belongs to each publisher.
        </p>
        <KenyaWireBoard />
        <ul className="mt-10 grid sm:grid-cols-2 gap-3 text-sm">
          {KENYA_WIRE_OUTLETS.map((outlet) => (
            <li key={outlet.handle} className="border border-border px-4 py-3">
              <p className="font-bold">{outlet.name}</p>
              <a className="text-primary text-xs" href={`https://x.com/${outlet.handle}`} target="_blank" rel="noopener noreferrer">
                @{outlet.handle}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}
