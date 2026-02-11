import { Layout } from "@/components/layout/Layout";
import { Users, Target, Award, Newspaper, Sparkles, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-4">
          About <span className="text-primary">The Scoop KE</span>
        </h1>
        
        <div className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2 rounded-full mb-8">
          <Sparkles className="w-4 h-4" />
          <span className="font-bold text-sm">Kenya's First Sheng News & Entertainment Website</span>
        </div>
        
        <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
          Tuko hapa kubadilisha game! The Scoop KE ni Kenya's first-ever Sheng news and entertainment website — tunaleta breaking news, celebrity gossip, na trending stories kwa lugha yenye gen Z na millennials wanashika. No cap, hii ni home yako ya habari.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Our Mission</h2>
            <p className="text-muted-foreground">
              Kuleta news kwa lugha yenye watu wanaongea kwa mtaa — Sheng. Hatutaki kizungu mingi, tunataka kila msee ashike rada ya what's happening in Kenya and beyond. Timely, accurate, na engaging content kwa watu wa streets.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Our Values</h2>
            <p className="text-muted-foreground">
              Integrity, accuracy, na respect for our readers ndo inaguide kila kitu tunafanya. Tunaamini in responsible journalism yenye ina-entertain huku iki-inform. Ukweli ndio base yetu.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Why Sheng?</h2>
            <p className="text-muted-foreground">
              Sheng ni lugha ya streets, ya youth, ya culture ya Kenya. Millions of Kenyans communicate in Sheng daily — so mbona news iwe kwa English pekee? Sisi tunabring news closer kwa watu, kwa lugha yenye inahit different.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Our Team</h2>
            <p className="text-muted-foreground">
              A dedicated team of journalists, writers, na digital experts wenye wako passionate about storytelling na wamecommit kuleta the best content kila siku. Sisi ni wasee wa mtaa wanaelewa mtaa.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider md:col-span-2">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Newspaper className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">What We Cover</h2>
            <p className="text-muted-foreground">
              From breaking news na politics hadi entertainment, sports, lifestyle, na celebrity gossip — tunakuwa covering stories zote zenye watu wanataka kuskia. Kenya, East Africa, na beyond — kama kuna story hot, sisi tuko juu yake.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 border border-primary/20">
          <h2 className="text-2xl font-serif font-bold text-headline mb-4">Our Story</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="mb-4">
              The Scoop KE ilianzishwa na goal moja simple: kuunda platform yenye Kenyans wanaweza kupata reliable, engaging, na relevant news content kwa lugha yao — Sheng. Sisi ndio wa kwanza kufanya hii kwa scale hii, na tuko proud.
            </p>
            <p className="mb-4">
              What started as a passion project imegrow kuwa one of Kenya's most unique na trusted sources for entertainment news na lifestyle content kwa Sheng. Tumejenga community ya readers wenye wanatutrust kuleta stories zenye zina-matter.
            </p>
            <p>
              As we continue to grow, our commitment inabaki the same — to serve our readers na content yenye inainform, ina-entertain, na ina-inspire. The Scoop KE — Kenya's first Sheng news website. Hakuna ingine kama sisi.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
