import { Layout } from "@/components/layout/Layout";
import { Search, CheckCircle, FileText, Fingerprint } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function FactCheckPage() {
  return (
    <Layout>
      <Helmet>
        <title>Fact-Checking Policy | Za Ndani</title>
        <meta name="description" content="How we verify stories and ensure the news you read on Za Ndani is based on facts. Primary sources, cross-verification, and transparency." />
        <link rel="canonical" href="https://zandani.co.ke/fact-check" />
        <meta property="og:title" content="Fact-Checking Policy | Za Ndani" />
        <meta property="og:description" content="How we verify stories and ensure the news you read on Za Ndani is based on facts." />
        <meta property="og:url" content="https://zandani.co.ke/fact-check" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Za Ndani" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Fact-Checking Policy | Za Ndani" />
        <meta name="twitter:description" content="How we verify stories and ensure the news you read is based on facts." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Fact-Checking Policy",
          "url": "https://zandani.co.ke/fact-check",
          "description": "Za Ndani fact-checking standards: primary sourcing, cross-verification, and transparent labeling.",
          "isPartOf": { "@type": "WebSite", "name": "Za Ndani", "url": "https://zandani.co.ke" },
          "publisher": { "@type": "Organization", "name": "Za Ndani", "url": "https://zandani.co.ke" }
        })}</script>
      </Helmet>

      <section className="border-b border-divider bg-background">
        <div className="h-[3px] w-full bg-primary" />
        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-14">
          <p className="text-[10px] font-black tracking-[0.28em] uppercase text-primary mb-4">Verification</p>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-[0.95] mb-4">
            Fact-checking policy
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            In Kenyan politics and entertainment, rumours move faster than affidavits. The job is to separate the tea from the truth.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl mx-auto px-4 py-16 md:py-20">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="grid md:grid-cols-2 gap-8 my-8 not-prose">
            <div className="p-6 border border-divider rounded-2xl bg-surface">
              <Search className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2 text-headline">Primary Sourcing</h3>
              <p className="text-sm text-muted-foreground">
                We prioritize first-hand accounts, official documents, and direct
                quotes over second-hand rumors.
              </p>
            </div>
            <div className="p-6 border border-divider rounded-2xl bg-surface">
              <Fingerprint className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2 text-headline">Cross-Verification</h3>
              <p className="text-sm text-muted-foreground">
                Sensitive claims require verification from at least two independent
                sources before publication.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">Our Verification Standard</h2>
          <p>
            Every article undergoes a rigorous checks-and-balances process. Our editors
            evaluate every story based on the following criteria:
          </p>
          <ul className="space-y-4 my-8 not-prose list-none p-0">
            <li className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <strong>Reliability of Source:</strong> Is the informant in a position to know the truth? What is their history with us?
              </div>
            </li>
            <li className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <strong>Evidence:</strong> Is there photographic, documentary, or digital evidence to support the claim?
              </div>
            </li>
            <li className="flex gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <strong>Context:</strong> Does the story align with known events and timelines?
              </div>
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">Social Media & Viral Content</h2>
          <p>
            We do not treat social media trending topics as fact. When a story breaks
            on X (Twitter), TikTok, or Instagram, we investigate the metadata and
            origins of the posts before reporting them as verified news.
          </p>

          <div className="mt-16 p-8 bg-zinc-900 text-white border border-white/10 not-prose">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">The "Red" File</h3>
            </div>
            <p className="text-zinc-400">
              When we cannot 100% verify a story but believe the report is in the public interest,
              we explicitly label it as "Developing," "Rumor," or "Allegation" to maintain
              total transparency with our readers.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
