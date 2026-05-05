import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { ExternalLink, Radio } from "lucide-react";

type Station = {
  name: string;
  channelId: string;
  youtubeUrl: string;
  description: string;
};

const SITE_URL = "https://zandani.co.ke";

const stations: Station[] = [
  {
    name: "Citizen TV Kenya",
    channelId: "UChBQgieUidXV1CmDxSdRm3g",
    youtubeUrl: "https://www.youtube.com/@kenyacitizentv",
    description: "Breaking news, current affairs, and national coverage.",
  },
  {
    name: "KTN News Kenya",
    channelId: "UCKVsdeoHExltrWMuK0hOWmg",
    youtubeUrl: "https://www.youtube.com/@KTNNewsKenya",
    description: "24/7 updates, politics, and public-interest reporting.",
  },
  {
    name: "NTV Kenya",
    channelId: "UCqBJ47FjJcl61fmSbcadAVg",
    youtubeUrl: "https://www.youtube.com/@ntvkenyaonline",
    description: "National headlines, business, and investigative stories.",
  },
  {
    name: "K24 TV",
    channelId: "UCt3SE-Mvs3WwP7UW-PiFdqQ",
    youtubeUrl: "https://www.youtube.com/@k24tv",
    description: "News coverage, interviews, and live Kenyan programming.",
  },
  {
    name: "TV47 Kenya",
    channelId: "UC_zA9UIWE1fB-jfFk_DBSYw",
    youtubeUrl: "https://www.youtube.com/@tv47kenya",
    description: "Trending news, discussions, and live studio broadcasts.",
  },
];

const TvPage = () => {
  return (
    <Layout>
      <Helmet>
        <title>Live TV | Kenyan News Channels on YouTube</title>
        <meta
          name="description"
          content="Watch top Kenyan TV stations live on Za Ndani through official YouTube channel embeds."
        />
        <link rel="canonical" href={`${SITE_URL}/tv`} />
      </Helmet>

      <section className="bg-zinc-950 text-white border-b border-zinc-800">
        <div className="container max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Radio className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Live TV</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-black leading-tight">
            Kenyan TV Channels
          </h1>
          <p className="text-zinc-300 mt-3 max-w-2xl">
            Watch live or latest streams from major Kenyan media stations directly on one page.
          </p>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {stations.map((station) => (
              <article key={station.channelId} className="border border-border bg-card overflow-hidden">
                <div className="aspect-video bg-muted">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/live_stream?channel=${station.channelId}&autoplay=0&mute=1`}
                    title={`${station.name} live stream`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold">{station.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{station.description}</p>
                  <a
                    href={station.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-3 hover:underline"
                  >
                    Open on YouTube <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TvPage;
