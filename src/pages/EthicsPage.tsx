import { Layout } from "@/components/layout/Layout";
import { ShieldCheck, Scale, HeartHandshake } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function EthicsPage() {
  return (
    <Layout>
      <Helmet>
        <title>Editorial Ethics & Standards | Za Ndani</title>
        <meta name="description" content="Our commitment to journalistic integrity, editorial independence, accuracy, and ethical reporting at Za Ndani — Kenya's digital newsroom." />
        <link rel="canonical" href="https://zandani.co.ke/ethics" />
        <meta property="og:title" content="Editorial Ethics & Standards | Za Ndani" />
        <meta property="og:description" content="Our commitment to journalistic integrity, editorial independence, and ethical reporting at Za Ndani." />
        <meta property="og:url" content="https://zandani.co.ke/ethics" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Za Ndani" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Editorial Ethics & Standards | Za Ndani" />
        <meta name="twitter:description" content="Our commitment to journalistic integrity, editorial independence, and ethical reporting." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Editorial Ethics & Standards",
          "url": "https://zandani.co.ke/ethics",
          "description": "Za Ndani editorial ethics and standards for accuracy, independence, and fairness.",
          "isPartOf": { "@type": "WebSite", "name": "Za Ndani", "url": "https://zandani.co.ke" },
          "publisher": { "@type": "Organization", "name": "Za Ndani", "url": "https://zandani.co.ke" }
        })}</script>
      </Helmet>

      <section className="border-b border-divider bg-background">
        <div className="h-[3px] w-full bg-primary" />
        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-14">
          <p className="text-[10px] font-black tracking-[0.28em] uppercase text-primary mb-4">Trust</p>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-[0.95] mb-4">
            Editorial ethics & standards
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            The trust of our readers is the newsroom’s most valuable asset. We deliver news and entertainment with integrity, accuracy, and fairness.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl mx-auto px-4 py-16 md:py-20">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="grid md:grid-cols-2 gap-8 my-8 not-prose">
            <div className="p-6 border border-divider rounded-2xl bg-surface">
              <Scale className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2 text-headline">Editorial Independence</h3>
              <p className="text-sm text-muted-foreground">
                Our editorial decisions are made independently. We do not allow advertisers,
                political interests, or corporate partners to influence our coverage.
              </p>
            </div>
            <div className="p-6 border border-divider rounded-2xl bg-surface">
              <ShieldCheck className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2 text-headline">Verification</h3>
              <p className="text-sm text-muted-foreground">
                We strive for accuracy. Every scoop is verified through multiple
                sources before it hits the site.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">1. Accuracy & Attribution</h2>
          <p>
            We aim to report the truth as we know it. When using information from other sources,
            we provide clear attribution. We do not knowingly publish false or misleading information.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">2. Fairness & Respect</h2>
          <p>
            We treat our subjects with respect. While we report on scandals and gossip,
            we avoid malicious intent and provide a right of reply whenever a serious
            allegation is made.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">3. Source Protection</h2>
          <p>
            Anonymity is granted only when a source is at risk and the information provided is
            in the public interest. We stand by our sources and protect their identity
            to the full extent of the law.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">4. Conflicts of Interest</h2>
          <p>
            Our journalists are required to disclose any personal or financial interests
            that might conflict with their reporting. We do not accept gifts or payments
            in exchange for favorable coverage.
          </p>

          <div className="mt-16 p-6 border-l-4 border-primary bg-primary/5 not-prose">
            <p className="flex items-center gap-2 font-bold mb-2 text-headline">
              <HeartHandshake className="w-5 h-5 text-primary" /> Reader trust
            </p>
            <p className="text-muted-foreground text-sm">
              Questions about our standards? Write to <a href="mailto:contact@zandani.co.ke" className="text-primary hover:underline">contact@zandani.co.ke</a>
              or see our <a href="/corrections" className="text-primary hover:underline">Corrections Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
