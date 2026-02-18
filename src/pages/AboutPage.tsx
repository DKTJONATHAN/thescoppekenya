import { Layout } from "@/components/layout/Layout";
import { Users, Target, Award, Newspaper, Sparkles, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-4">
          About <span className="text-primary">Za Ndani</span>
        </h1>
        
        <div className="inline-flex items-center gap-2 gradient-primary text-primary-foreground px-4 py-2 rounded-full mb-8">
          <Sparkles className="w-4 h-4" />
          <span className="font-bold text-sm">Bold. Unbiased. Insider. Kenya's Sheng News & Entertainment</span>
        </div>
        
        <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
          Za Ndani ni habari kutoka ndani — from the source, closest to the juice. Sisi ni Kenya's boldest Sheng news and entertainment website. Tunaleta breaking news, insider content, celebrity gossip, na trending stories bila bias, kwa lugha yenye gen Z na millennials wanashika. No cap, hii ni home yako ya ukweli.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Our Mission</h2>
            <p className="text-muted-foreground">
              Kuleta insider news kwa lugha ya mtaa — bold na bila bias. Za Ndani inamaanisha information kutoka ndani, from the source. Hatutaki kizungu mingi, tunataka kila msee ashike rada ya what's really happening. Ukweli, as it is.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Our Values</h2>
            <p className="text-muted-foreground">
              Bold truth, zero bias, na respect for our readers ndo inaguide kila kitu tunafanya. Tunaamini in fearless journalism yenye ina-entertain huku iki-inform. Ukweli ndio base yetu — we talk about it as it is.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Why Sheng?</h2>
            <p className="text-muted-foreground">
              Sheng ni lugha ya streets, ya youth, ya culture ya Kenya. Millions of Kenyans communicate in Sheng daily — so mbona news iwe kwa English pekee? Sisi tunabring insider news closer kwa watu, kwa lugha yenye inahit different.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Our Team</h2>
            <p className="text-muted-foreground">
              A dedicated team of journalists, writers, na digital experts wenye wako passionate about truth na storytelling. Sisi ni wasee wa mtaa wanaelewa mtaa — na tunakuletea habari kutoka ndani.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider md:col-span-2">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Newspaper className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">What We Cover</h2>
            <p className="text-muted-foreground">
              From breaking news na politics hadi entertainment, sports, lifestyle, na celebrity gossip — tunakuwa covering stories zote zenye watu wanataka kuskia. Kenya, East Africa, na beyond — kama kuna story hot, sisi tuko ndani yake.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 border border-primary/20">
          <h2 className="text-2xl font-serif font-bold text-headline mb-4">Our Story</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="mb-4">
              Za Ndani ilianzishwa na goal moja simple: kuunda platform yenye Kenyans wanaweza kupata bold, unbiased, na insider news content kwa lugha yao — Sheng. Jina lenyewe linamaanisha "from the inside" — habari kutoka source, where the juice is.
            </p>
            <p className="mb-4">
              What started as a passion project imegrow kuwa one of Kenya's most unique na trusted sources for insider news, entertainment na lifestyle content kwa Sheng. Tumejenga community ya readers wenye wanatutrust kuleta stories zenye zina-matter — bila sugar-coating.
            </p>
            <p>
              As we continue to grow, our commitment inabaki the same — bold truth, zero bias, na insider content yenye inainform, ina-entertain, na ina-inspire. Za Ndani — habari kutoka ndani. Hakuna ingine kama sisi.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
