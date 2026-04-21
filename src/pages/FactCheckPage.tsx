import { Layout } from "@/components/layout/Layout";
import { Search, CheckCircle, FileText, Fingerprint } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function FactCheckPage() {
  return (
    <Layout>
      <Helmet>
        <title>Fact-Checking Policy | Za Ndani</title>
        <meta name="description" content="How we verify stories and ensure the news you read on Za Ndani is based on facts." />
      </Helmet>
      
      <div className="container max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-8">Fact-Checking Policy</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="lead text-xl text-muted-foreground mb-12">
            In the fast-moving world of Kenyan entertainment and politics, rumors spread quickly. 
            At Za Ndani, our job is to separate the "tea" from the truth.
          </p>

          <div className="grid md:grid-cols-2 gap-8 my-16">
            <div className="p-6 border border-divider rounded-2xl bg-surface">
              <Search className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Primary Sourcing</h3>
              <p className="text-sm text-muted-foreground">
                We prioritize first-hand accounts, official documents, and direct 
                quotes over second-hand rumors.
              </p>
            </div>
            <div className="p-6 border border-divider rounded-2xl bg-surface">
              <Fingerprint className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Cross-Verification</h3>
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
          <ul className="space-y-4 my-8">
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

          <div className="mt-16 p-8 bg-zinc-900 text-white rounded-3xl border border-white/10">
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
