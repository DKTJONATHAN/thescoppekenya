import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { getAllPosts } from "@/lib/markdown";

const HUBS: Record<string, { title: string; intro: string; keywords: string[] }> = {
  energy: {
    title: "Kenya energy news",
    intro: "Kenya energy news is moving fast, and this page tracks the stories that affect households and businesses every day. From EPRA announcements and fuel price reviews to electricity tariffs, blackouts, and policy shifts, we compile key developments in one place. You will also find coverage of taxation changes, distribution updates, and market reactions that shape what Kenyans pay at the pump and on monthly power bills. Our goal is to make energy reporting practical and easy to follow by highlighting what changed, why it matters, and what people should watch next. If you are monitoring fuel trends, power reliability, or government energy decisions, this hub gives you a reliable overview built from recent reports and ongoing updates.",
    keywords: ["epra", "fuel", "electricity", "power", "token", "petrol", "diesel", "kplc"]
  },
  education: {
    title: "Kenya education news",
    intro: "Kenya education news often changes quickly during application windows, exam periods, and placement cycles. This hub brings together stories on KUCCPS admissions, university updates, TSC announcements, cluster points, funding, and student policy changes. We focus on practical guidance for learners, parents, and teachers by summarizing key deadlines, eligibility rules, and official statements in clear language. You will also see coverage of campus decisions, program cut-off trends, and teacher-service developments that affect schools nationwide. Whether you are preparing for university placement, following teacher recruitment, or tracking ministry policy changes, this page offers a useful single destination for current education reporting and context that helps readers make informed decisions.",
    keywords: ["kuccps", "university", "tsc", "cluster points", "kcse", "placement", "admission"]
  },
  finance: {
    title: "Kenya finance news",
    intro: "Kenya finance news impacts savings, borrowing, jobs, and business confidence across the country. This hub compiles major updates on KCB and other banks, forex trends, bond performance, lending rates, and policy signals from regulators. We also track shifts in digital payments, capital markets, and corporate moves that shape consumer and investor decisions. Instead of fragmented updates, readers can follow a structured stream of stories that explains what happened and what it may mean for households and enterprises. If you are watching exchange-rate pressure, debt-market sentiment, bank announcements, or personal-finance implications of economic policy, this page provides consistent reporting to help you stay informed and act early.",
    keywords: ["kcb", "bank", "forex", "bonds", "economy", "cbk", "loan", "interest"]
  },
  sports: {
    title: "Kenya sports news",
    intro: "Kenya sports news covers both local passion and global competitions that fans follow every week. This hub brings together football updates, Premier League headlines, Harambee Stars coverage, and other Kenyan sports stories in one feed. We include match-impact analysis, player updates, coaching decisions, and competition narratives that explain why each story matters beyond the final score. You will also find coverage of athletics and domestic sports moments that shape national conversation. The goal is to give supporters a clear, current snapshot of key developments without jumping across multiple pages. If you track fixtures, team form, transfer talk, and Kenyan performance at home and abroad, this page is built to keep you up to speed.",
    keywords: ["football", "premier league", "harambee", "sports", "athletics", "match", "league"]
  },
  entertainment: {
    title: "Kenya entertainment news",
    intro: "Kenya entertainment news evolves by the hour, from celebrity updates and music drops to social-media controversies and industry moves. This hub gathers trending gossip, artist news, relationship stories, and pop-culture developments in one place so readers can follow the full conversation. We prioritize timely context around what happened, who is involved, and how audiences are reacting online and offline. You will also find stories on concerts, collaborations, awards, and creator economy moments shaping youth culture in Kenya. For readers who want a fast but grounded way to keep up with celebrity, gossip, and music headlines, this page offers a clear stream of recent entertainment coverage curated for daily follow-through.",
    keywords: ["celebrity", "gossip", "music", "artist", "entertainment", "viral", "showbiz"]
  }
};

export default function HubPage() {
  const { hub } = useParams<{ hub: string }>();
  const config = hub ? HUBS[hub] : undefined;
  const posts = getAllPosts();
  const filtered = config
    ? posts.filter((p) => {
        const hay = `${p.title} ${p.excerpt} ${p.category} ${(p.tags || []).join(" ")}`.toLowerCase();
        return config.keywords.some((k) => hay.includes(k));
      })
    : [];

  if (!config) return <Layout><div className="container py-20"><h1 className="text-3xl font-bold">Hub not found</h1></div></Layout>;

  const canonical = `https://zandani.co.ke/${hub}`;
  return (
    <Layout>
      <Helmet>
        <title>{config.title} | Zandani</title>
        <meta name="description" content={config.intro.slice(0, 155)} />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <div className="container max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-serif font-black mb-4 capitalize">{hub}</h1>
        <p className="text-muted-foreground leading-8 mb-8">{config.intro}</p>
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((p) => (
            <Link key={p.slug} to={`/article/${p.slug}`} className="border border-divider p-4 hover:border-primary transition-colors">
              <h2 className="font-bold">{p.title}</h2>
              <p className="text-sm text-muted-foreground mt-2">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
