import { Layout } from "@/components/layout/Layout";
import { ShieldCheck, Scale, Users, HeartHandshake } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function EthicsPage() {
  return (
    <Layout>
      <Helmet>
        <title>Editorial Ethics & Standards | Za Ndani</title>
        <meta name="description" content="Our commitment to journalistic integrity, editorial independence, and ethical reporting at Za Ndani." />
      </Helmet>
      
      <div className="container max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-8">Editorial Ethics & Standards</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="lead text-xl text-muted-foreground mb-12">
            At Za Ndani, we believe that the trust of our readers is our most valuable asset. 
            We are committed to delivering news and entertainment with integrity, accuracy, and fairness.
          </p>

          <div className="grid md:grid-cols-2 gap-8 my-16">
            <div className="p-6 border border-divider rounded-2xl bg-surface">
              <Scale className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Editorial Independence</h3>
              <p className="text-sm text-muted-foreground">
                Our editorial decisions are made independently. We do not allow advertisers, 
                political interests, or corporate partners to influence our coverage.
              </p>
            </div>
            <div className="p-6 border border-divider rounded-2xl bg-surface">
              <ShieldCheck className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Verification</h3>
              <p className="text-sm text-muted-foreground">
                We strive for 100% accuracy. Every scoop is verified through multiple 
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
        </div>
      </div>
    </Layout>
  );
}
