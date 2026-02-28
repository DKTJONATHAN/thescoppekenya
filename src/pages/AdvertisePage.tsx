import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Zap, Target, Mail, Phone, Globe, MousePointerClick, TrendingUp, Award } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function AdvertisePage() {
  return (
    <Layout>
      <Helmet>
        <title>Advertise with Za Ndani | Premier Kenyan Digital Media Network</title>
        <meta
          name="description"
          content="Scale your brand with Za Ndani. Access high-intent Kenyan audiences through professional display ads, sponsored content, and bespoke digital campaigns."
        />
      </Helmet>

      <div className="container max-w-6xl mx-auto px-4 py-16 md:py-24">
        {/* Header Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-serif font-black text-headline mb-6 tracking-tight">
            Influence the <span className="text-primary italic">Trendsetters</span>.
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Za Ndani connects world-class brands with Kenya’s most engaged digital audience. 
            From breaking news to lifestyle shifts, we provide the platform; you provide the vision.
          </p>
        </div>

        {/* Data Points / Media Kit Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-24">
          {[
            { label: "Monthly Impressions", value: "250K+", icon: BarChart3 },
            { label: "Unique Visitors", value: "50K+", icon: Users },
            { label: "Avg. Engagement", value: "4.2%", icon: MousePointerClick },
            { label: "Mobile First", value: "82%", icon: Zap },
          ].map((stat, i) => (
            <div key={i} className="bg-surface rounded-3xl p-8 border border-divider flex flex-col items-center text-center shadow-sm">
              <stat.icon className="w-6 h-6 text-primary mb-4 opacity-70" />
              <p className="text-4xl font-black text-headline mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="mb-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-headline mb-4">
                The Za Ndani Advantage
              </h2>
              <p className="text-muted-foreground text-lg">
                We don't just host ads; we integrate brands into the Kenyan cultural conversation.
              </p>
            </div>
            <div className="hidden md:block h-px bg-divider flex-grow mx-8 mb-5"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-headline">Hyper-Local Targeting</h3>
              <p className="text-muted-foreground leading-relaxed">
                Reach specific demographics across Nairobi, Mombasa, Kisumu, and the growing diaspora market with precision.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-headline">High Intent Audience</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our readers are active consumers of tech, finance, and lifestyle products, looking for the next big thing.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-headline">Brand Safety</h3>
              <p className="text-muted-foreground leading-relaxed">
                Professional editorial standards ensure your brand is always associated with quality, verified journalism.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing/Packages Table */}
        <div className="mb-24">
          <h2 className="text-3xl font-serif font-bold text-headline text-center mb-12">Ad Solutions</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Standard */}
            <div className="bg-surface rounded-3xl p-8 border border-divider flex flex-col">
              <h3 className="text-xl font-bold text-headline mb-2">Display Network</h3>
              <p className="text-sm text-muted-foreground mb-6">High-impact banner placements across our most visited articles.</p>
              <div className="mt-auto pt-6 border-t border-divider">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Starts at</p>
                <p className="text-3xl font-black text-primary">KES 7,500 <span className="text-sm font-normal text-muted-foreground">/wk</span></p>
              </div>
            </div>

            {/* Featured */}
            <div className="bg-headline text-white rounded-3xl p-8 shadow-2xl scale-105 relative z-10 flex flex-col border-2 border-primary">
              <div className="absolute -top-4 right-8 bg-primary text-primary-foreground text-[10px] font-black px-4 py-1 rounded-full tracking-[0.2em] uppercase">
                Premium
              </div>
              <h3 className="text-xl font-bold mb-2">Native Content</h3>
              <p className="text-sm text-white/70 mb-6">Expertly crafted "Za Ndani" style articles that feature your product naturally.</p>
              <div className="mt-auto pt-6 border-t border-white/10">
                <p className="text-xs text-white/50 uppercase font-bold tracking-widest mb-1">Starts at</p>
                <p className="text-3xl font-black text-primary">KES 20,000 <span className="text-sm font-normal text-white/50">/ea</span></p>
              </div>
            </div>

            {/* Custom */}
            <div className="bg-surface rounded-3xl p-8 border border-divider flex flex-col">
              <h3 className="text-xl font-bold text-headline mb-2">Social & Pulse</h3>
              <p className="text-sm text-muted-foreground mb-6">Collaborative social media campaigns and newsletter takeovers.</p>
              <div className="mt-auto pt-6 border-t border-divider">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Starts at</p>
                <p className="text-3xl font-black text-primary">KES 5,000 <span className="text-sm font-normal text-muted-foreground">/post</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-surface to-divider rounded-[3rem] p-10 md:p-20 text-center border border-divider">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-6 leading-tight">
              Ready to command <br />the room?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Download our full 2026 Media Kit or request a bespoke quote for your upcoming campaign.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-14 px-8 rounded-full gradient-primary text-primary-foreground font-bold">
                <a href="mailto:ads@zandani.co.ke">
                  <Mail className="w-5 h-5 mr-2" />
                  Request Media Kit
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full border-2 font-bold">
                <a href="tel:+254706396305">
                  <Phone className="w-5 h-5 mr-2" />
                  Talk to Sales
                </a>
              </Button>
            </div>
            <p className="mt-10 text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Globe className="w-3 h-3" />
              Trusted by leading brands in Nairobi & beyond.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}