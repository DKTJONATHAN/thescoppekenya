import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, Mail, Sparkles, Rocket, Fingerprint, Coffee } from "lucide-react";

const openPositions = [
  {
    title: "Senior Editorial Writer",
    location: "Nairobi / Hybrid",
    type: "Full-time",
    category: "Editorial",
    description: "We are seeking a sharp-witted storyteller with a deep understanding of Kenyan politics and pop culture. You must be able to turn complex news into compelling, high-traffic narratives."
  },
  {
    title: "Social Media Strategist",
    location: "Remote",
    type: "Full-time",
    category: "Digital Growth",
    description: "Go beyond posting. We need a data-driven creator to manage our presence across TikTok and X, turning breaking news into viral engagement."
  },
  {
    title: "Investigative Contributor",
    location: "Remote",
    type: "Freelance",
    category: "Reporting",
    description: "Do you have deep-rooted sources? We pay premium rates for exclusive 'Za Ndani' (insider) stories that haven't hit the mainstream media yet."
  }
];

export default function CareersPage() {
  return (
    <Layout>
      <div className="container max-w-5xl mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3 h-3" />
            <span>Now Hiring for 2026</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black text-headline mb-6 tracking-tight">
            Shape the <span className="text-primary underline underline-offset-8">Narrative</span>.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join a newsroom that values courage over convention. We’re building the future of Kenyan media, and we need your voice.
          </p>
        </div>

        {/* Culture / Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
          {[
            { 
              title: "Radical Autonomy", 
              desc: "Remote-first culture with the tools to work from anywhere in East Africa.", 
              icon: Rocket 
            },
            { 
              title: "Unique Voice", 
              desc: "We don't do 'boring.' We encourage bold, opinionated, and fearless writing.", 
              icon: Fingerprint 
            },
            { 
              title: "Rapid Growth", 
              desc: "Be part of a scaling startup where your impact is felt on day one.", 
              icon: Sparkles 
            },
            { 
              title: "The Network", 
              desc: "Access to the exclusive events, people, and 'juice' that defines Kenya.", 
              icon: Coffee 
            },
          ].map((perk, i) => (
            <div key={i} className="p-8 rounded-3xl bg-surface border border-divider hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <perk.icon className="w-8 h-8 text-primary mb-6" />
              <h3 className="text-lg font-bold text-headline mb-2">{perk.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{perk.desc}</p>
            </div>
          ))}
        </div>

        {/* Open Positions */}
        <div className="mb-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-serif font-bold text-headline mb-2">The Newsroom is Open</h2>
              <p className="text-muted-foreground">Current opportunities to join the Za Ndani team.</p>
            </div>
            <div className="h-px bg-divider flex-grow mx-8 mb-4 hidden md:block"></div>
          </div>

          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <div key={index} className="group bg-surface rounded-[2rem] p-8 border border-divider hover:border-primary transition-all shadow-sm overflow-hidden relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-headline text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {position.category}
                      </span>
                      <span className="text-primary text-sm font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {position.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-headline mb-3 group-hover:text-primary transition-colors">
                      {position.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" />
                        {position.location}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{position.description}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button asChild size="lg" className="rounded-full gradient-primary text-primary-foreground font-bold px-8 h-14">
                      <a href={`mailto:careers@zandani.co.ke?subject=Application: ${position.title}`}>
                        Apply to this Role
                      </a>
                    </Button>
                  </div>
                </div>
                {/* Decorative background element for hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
              </div>
            ))}
          </div>
        </div>

        {/* General Application / Talent Pool */}
        <div className="relative overflow-hidden bg-headline text-white rounded-[3rem] p-10 md:p-16 text-center">
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Don't see your role?</h2>
            <p className="text-white/70 text-lg mb-10">
              We are always looking for 'insiders'—developers, creators, and analysts who can help us grow. 
              Send a pitch and your portfolio; we might just create a role for you.
            </p>
            <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 hover:bg-white hover:text-headline h-14 px-10 transition-all font-bold">
              <a href="mailto:careers@zandani.co.ke?subject=Speculative Talent Application">
                <Mail className="w-5 h-5 mr-2" />
                Join Our Talent Pool
              </a>
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        </div>
      </div>
    </Layout>
  );
}