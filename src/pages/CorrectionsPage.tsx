import { Layout } from "@/components/layout/Layout";
import { RefreshCcw, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function CorrectionsPage() {
  return (
    <Layout>
      <Helmet>
        <title>Corrections Policy | Za Ndani</title>
        <meta name="description" content="Our commitment to accuracy and the process for reporting errors on Za Ndani. How we correct mistakes and protect reader trust." />
        <link rel="canonical" href="https://zandani.co.ke/corrections" />
        <meta property="og:title" content="Corrections Policy | Za Ndani" />
        <meta property="og:description" content="Our commitment to accuracy and the process for reporting errors on Za Ndani." />
        <meta property="og:url" content="https://zandani.co.ke/corrections" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Za Ndani" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Corrections Policy | Za Ndani" />
        <meta name="twitter:description" content="Our commitment to accuracy and the process for reporting errors." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Corrections Policy",
          "url": "https://zandani.co.ke/corrections",
          "description": "Za Ndani corrections policy: how we fix errors and keep readers informed.",
          "isPartOf": { "@type": "WebSite", "name": "Za Ndani", "url": "https://zandani.co.ke" },
          "publisher": { "@type": "Organization", "name": "Za Ndani", "url": "https://zandani.co.ke" }
        })}</script>
      </Helmet>

      <section className="border-b border-divider bg-background">
        <div className="h-[3px] w-full bg-primary" />
        <div className="container max-w-4xl mx-auto px-4 py-12 md:py-14">
          <p className="text-[10px] font-black tracking-[0.28em] uppercase text-primary mb-4">Accountability</p>
          <h1 className="text-4xl md:text-6xl font-serif font-black leading-[0.95] mb-4">
            Corrections policy
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Accuracy is the job. When we get it wrong, we admit it, fix it, and tell the reader.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl mx-auto px-4 py-16 md:py-20">
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex flex-col md:flex-row gap-8 my-8 not-prose">
            <div className="flex-1 p-8 border border-divider rounded-2xl bg-surface">
              <RefreshCcw className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-headline">Our Process</h3>
              <ul className="space-y-3 list-none p-0 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Verify the reported error immediately.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Update the article with the correct information.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <span>Add a clear "Correction" note at the top or bottom of the page.</span>
                </li>
              </ul>
            </div>

            <div className="flex-1 p-8 border border-primary/20 rounded-2xl bg-primary/5">
              <Mail className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-headline">Report an Error</h3>
              <p className="text-sm mb-4 text-muted-foreground">
                If you believe we have published something incorrect, please let us know immediately.
              </p>
              <div className="space-y-2 font-bold text-headline">
                <p>Email: contact@zandani.co.ke</p>
                <p>WhatsApp: 0706396305</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">1. Types of Corrections</h2>
          <p>
            <strong>Substantive Corrections:</strong> If we change the core facts or meaning of a story,
            we will add an update note explaining what was changed and why.
          </p>
          <p>
            <strong>Minor Typos:</strong> Small spelling or grammar errors that do not change the
            story's meaning may be fixed without a technical correction note.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-6 text-headline">2. Retractions</h2>
          <p>
            In the rare event that a story is found to be fundamentally flawed or ethically
            compromised beyond repair, we will issue a full retraction and explain the
            circumstances to our audience.
          </p>

          <div className="mt-16 p-6 border-l-4 border-amber-500 bg-amber-500/5 italic not-prose">
            <p className="flex items-center gap-2 font-bold mb-2 text-headline not-italic">
              <AlertTriangle className="w-5 h-5" /> Factual Fairness
            </p>
            <p className="text-muted-foreground text-sm">
              We value the feedback of our readers and the subjects of our stories.
              If you are mentioned in a story and feel it is inaccurate, you have a
              guaranteed right to request a review.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
