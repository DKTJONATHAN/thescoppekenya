import { Layout } from "@/components/layout/Layout";
import { Users, Target, Award, Newspaper, ShieldCheck, Zap, Globe, Code } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { PageHero } from "@/components/layout/PageHero";

export default function AboutPage() {
  return (
    <Layout>
      <Helmet>
        <title>About Us | Za Ndani</title>
        <meta name="description" content="Za Ndani is Kenya's premier digital newsroom delivering breaking news, exclusive entertainment insights, and trending stories with zero compromise." />
        <link rel="canonical" href="https://zandani.co.ke/about" />
        <meta property="og:title" content="About Us | Za Ndani" />
        <meta property="og:description" content="Za Ndani is Kenya's premier digital newsroom delivering breaking news, exclusive entertainment insights, and trending stories with zero compromise." />
        <meta property="og:url" content="https://zandani.co.ke/about" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Za Ndani" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="About Us | Za Ndani" />
        <meta name="twitter:description" content="Za Ndani is Kenya's premier digital newsroom delivering breaking news, exclusive entertainment insights, and trending stories." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Zandani",
          "url": "https://zandani.co.ke",
          "logo": "https://zandani.co.ke/logo.png",
          "foundingDate": "2024-01-01",
          "description": "Zandani is a Kenyan digital news platform covering general news, entertainment, sports, business and lifestyle.",
          "contactPoint": [{ "@type": "ContactPoint", "email": "contact@zandani.co.ke", "contactType": "newsroom" }]
        })}</script>
      </Helmet>

      <PageHero
        kicker="The newsroom"
        title={<>Inside the <span className="text-primary italic">pulse</span> of Kenya.</>}
        dek="Za Ndani is a Nairobi newsroom. Breaking news, entertainment receipts, sports, and the commentary Kenyans already make in traffic."
      />

      <div className="container max-w-5xl mx-auto px-4 py-14 md:py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-3xl font-serif font-bold">Our editorial mandate</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              In an era of filtered information and "safe" headlines, <strong className="text-foreground">Za Ndani</strong> exists to provide
              the unfiltered record. Derived from the Swahili phrase for <em>"From Within,"</em> the job is a front-row seat to the stories shaping
              Kenya’s political, social, and entertainment landscapes.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We sit between broadsheet caution and street speed. Professional standards, Kenyan English, names you can verify.
            </p>
          </div>

          <div className="bg-surface p-7 border border-divider flex flex-col justify-center">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
                <div>
                  <h4 className="font-bold">Unbiased</h4>
                  <p className="text-sm text-muted-foreground">Reporting without fear or favor.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Zap className="w-7 h-7 text-primary" />
                <div>
                  <h4 className="font-bold">Fast</h4>
                  <p className="text-sm text-muted-foreground">Breaking news as it unfolds.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Target className="w-7 h-7 text-primary" />
                <div>
                  <h4 className="font-bold">Exclusive</h4>
                  <p className="text-sm text-muted-foreground">The juice you will not find on a press release.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-divider mb-20 border border-divider">
          {[
            { icon: Newspaper, title: "Hard news", copy: "Politics, policy, and national events handled with precision." },
            { icon: Award, title: "Entertainment", copy: "The real stories behind the stars. Industry moves, music, film." },
            { icon: Users, title: "Celebrity juice", copy: "Deep dives into the people moving the needle — receipts first." },
            { icon: Globe, title: "Lifestyle", copy: "Culture, fashion, and the tech-driven future of East Africa." },
          ].map((item) => (
            <div key={item.title} className="p-6 bg-background">
              <item.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </div>

        <section className="mb-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-black tracking-[0.22em] uppercase text-primary mb-3">Ownership</p>
            <h2 className="text-3xl font-serif font-bold mb-6">Transparency</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              <strong className="text-foreground">Za Ndani</strong> is an independent Kenyan digital media organization,
              owned and operated by the <strong className="text-foreground">Jonathan Mwaniki Media Group</strong>.
            </p>
            <div className="space-y-3">
              {["100% Kenyan owned", "Newsroom in Nairobi", "Ad-supported and independent"].map((line, i) => (
                <div key={line} className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-black text-[10px]">{i + 1}</div>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-video overflow-hidden border border-divider bg-surface flex flex-col items-center justify-center p-8 text-center">
            <Globe className="w-14 h-14 text-primary mb-4 opacity-40" />
            <h3 className="text-2xl font-serif font-bold mb-2">Our newsroom</h3>
            <p className="text-muted-foreground text-sm">Operating from Nairobi to bring you stories from the inside.</p>
          </div>
        </section>

        <div className="relative overflow-hidden border border-divider bg-surface p-8 md:p-14 mb-16">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-5">The architecture of truth</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Designed and developed by{" "}
              <a href="https://www.jonathanmwaniki.co.ke" className="text-primary hover:underline underline-offset-4">jonathanmwaniki.co.ke</a>.
              Built for speed, EAT timestamps, and a reader who is already on the matatu.
            </p>
            <div className="flex items-center gap-2 text-primary font-mono text-sm uppercase tracking-widest">
              <Code className="w-4 h-4" />
              <span>Engineered in Nairobi</span>
            </div>
          </div>
        </div>

        <footer className="text-center border-t border-divider pt-10">
          <p className="text-muted-foreground font-serif italic text-xl">
            "Za Ndani — because the truth is always found on the inside."
          </p>
        </footer>
      </div>
    </Layout>
  );
}
