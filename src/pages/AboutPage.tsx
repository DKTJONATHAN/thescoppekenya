import { Layout } from "@/components/layout/Layout";
import { Users, Target, Award, Newspaper } from "lucide-react";

export default function AboutPage() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-6">
          About <span className="text-primary">The Scoop KE</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
          Kenya's premier destination for breaking news, entertainment updates, celebrity gossip, and trending stories that matter to you.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Our Mission</h2>
            <p className="text-muted-foreground">
              To deliver timely, accurate, and engaging news content that keeps Kenyans informed and entertained. We bridge the gap between what's happening and what matters to our readers.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Our Values</h2>
            <p className="text-muted-foreground">
              Integrity, accuracy, and respect for our readers guide everything we do. We believe in responsible journalism that entertains while informing.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">Our Team</h2>
            <p className="text-muted-foreground">
              A dedicated team of journalists, writers, and digital experts passionate about storytelling and committed to bringing you the best content every day.
            </p>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-divider">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Newspaper className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-headline mb-3">What We Cover</h2>
            <p className="text-muted-foreground">
              From breaking news and politics to entertainment, sports, lifestyle, and celebrity gossip – we cover stories that resonate with our audience across Kenya and East Africa.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 border border-primary/20">
          <h2 className="text-2xl font-serif font-bold text-headline mb-4">Our Story</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="mb-4">
              The Scoop KE was founded with a simple goal: to create a platform where Kenyans can find reliable, engaging, and relevant news content in one place.
            </p>
            <p className="mb-4">
              What started as a passion project has grown into one of Kenya's most trusted sources for entertainment news and lifestyle content. We've built a community of readers who trust us to deliver stories that matter.
            </p>
            <p>
              As we continue to grow, our commitment remains the same – to serve our readers with content that informs, entertains, and inspires.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}