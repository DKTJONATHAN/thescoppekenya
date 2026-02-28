import { Layout } from "@/components/layout/Layout";
import { Users, Target, Award, Newspaper, ShieldCheck, Zap, Globe, Code } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <div className="container max-w-5xl mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-serif font-black text-headline mb-6 tracking-tight">
            Inside the <span className="text-primary italic">Pulse</span> of Kenya.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Za Ndani is Kenya’s premier digital newsroom delivering high-octane journalism, 
            exclusive entertainment insights, and breaking news with zero compromise.
          </p>
        </section>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="md:col-span-2 space-y-8">
            <h2 className="text-3xl font-serif font-bold text-headline">Our Editorial Mandate</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              In an era of filtered information and "safe" headlines, <strong>Za Ndani</strong> exists to provide 
              the raw, unfiltered truth. Derived from the Swahili phrase for <em>"From Within,"</em> our 
              mission is to provide our audience with a front-row seat to the stories shaping 
              Kenya’s political, social, and entertainment landscapes.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We bridge the gap between traditional broadsheets and the fast-paced digital street culture. 
              By blending professional journalistic integrity with the vibrant energy of Kenyan youth, 
              we ensure that news isn't just read—it's felt.
            </p>
          </div>
          
          <div className="bg-surface p-8 rounded-3xl border border-divider shadow-sm flex flex-col justify-center">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-bold text-headline">Unbiased</h4>
                  <p className="text-sm text-muted-foreground">Reporting without fear or favor.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Zap className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-bold text-headline">Fast</h4>
                  <p className="text-sm text-muted-foreground">Breaking news as it unfolds.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Target className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-bold text-headline">Exclusive</h4>
                  <p className="text-sm text-muted-foreground">The "juice" you won't find anywhere else.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          <div className="p-6 bg-surface border border-divider rounded-2xl">
            <Newspaper className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Hard News</h3>
            <p className="text-sm text-muted-foreground">Politics, policy, and breaking national events handled with precision.</p>
          </div>
          <div className="p-6 bg-surface border border-divider rounded-2xl">
            <Award className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Entertainment</h3>
            <p className="text-sm text-muted-foreground">The real stories behind the stars. Industry moves, music, and film.</p>
          </div>
          <div className="p-6 bg-surface border border-divider rounded-2xl">
            <Users className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Celebrity Juice</h3>
            <p className="text-sm text-muted-foreground">Deep dives into the trends and personalities moving the needle.</p>
          </div>
          <div className="p-6 bg-surface border border-divider rounded-2xl">
            <Globe className="w-10 h-10 text-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Lifestyle</h3>
            <p className="text-sm text-muted-foreground">Culture, fashion, and the tech-driven future of East Africa.</p>
          </div>
        </div>

        {/* Origins & Tech Section */}
        <div className="relative overflow-hidden rounded-3xl bg-headline text-white p-8 md:p-16">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-white">The Architecture of Truth</h2>
            <p className="text-white/80 text-lg mb-8">
              Za Ndani isn't just a news site; it's a digital experience built for the modern reader. 
              Designed and developed by the creative minds at <a href="https://www.jonathanmwaniki.co.ke" className="text-primary hover:underline underline-offset-4">jonathanmwaniki.co.ke</a>, 
              this platform utilizes cutting-edge technology to ensure that stories reach you with 
              unmatched speed and clarity.
            </p>
            <div className="flex items-center gap-2 text-primary font-mono text-sm uppercase tracking-widest">
              <Code className="w-4 h-4" />
              <span>Engineered for Excellence</span>
            </div>
          </div>
          {/* Subtle background decorative element */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        </div>

        <footer className="mt-20 text-center border-t border-divider pt-12">
          <p className="text-muted-foreground font-serif italic text-xl">
            "Za Ndani — Because the truth is always found on the inside."
          </p>
        </footer>
      </div>
    </Layout>
  );
}