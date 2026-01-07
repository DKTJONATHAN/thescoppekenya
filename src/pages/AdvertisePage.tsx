import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Zap, Target, Mail, Phone } from "lucide-react";

export default function AdvertisePage() {
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-4">
            Advertise with <span className="text-primary">The Scoop KE</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Reach thousands of engaged Kenyan readers daily. Partner with us to grow your brand.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-surface rounded-2xl p-6 text-center border border-divider">
            <p className="text-3xl md:text-4xl font-bold text-primary mb-2">50K+</p>
            <p className="text-muted-foreground">Monthly Readers</p>
          </div>
          <div className="bg-surface rounded-2xl p-6 text-center border border-divider">
            <p className="text-3xl md:text-4xl font-bold text-primary mb-2">100K+</p>
            <p className="text-muted-foreground">Page Views</p>
          </div>
          <div className="bg-surface rounded-2xl p-6 text-center border border-divider">
            <p className="text-3xl md:text-4xl font-bold text-primary mb-2">25K+</p>
            <p className="text-muted-foreground">Social Followers</p>
          </div>
          <div className="bg-surface rounded-2xl p-6 text-center border border-divider">
            <p className="text-3xl md:text-4xl font-bold text-primary mb-2">70%</p>
            <p className="text-muted-foreground">Mobile Traffic</p>
          </div>
        </div>

        {/* Why Advertise */}
        <div className="mb-16">
          <h2 className="text-3xl font-serif font-bold text-headline text-center mb-10">
            Why Advertise With Us?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif font-bold text-headline mb-2">Engaged Audience</h3>
              <p className="text-muted-foreground text-sm">
                Our readers are actively engaged with content, spending quality time on our platform.
              </p>
            </div>
            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif font-bold text-headline mb-2">Targeted Reach</h3>
              <p className="text-muted-foreground text-sm">
                Reach Kenyans interested in news, entertainment, lifestyle, and trending topics.
              </p>
            </div>
            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif font-bold text-headline mb-2">Measurable Results</h3>
              <p className="text-muted-foreground text-sm">
                Get detailed analytics and reports on your campaign performance.
              </p>
            </div>
            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif font-bold text-headline mb-2">Flexible Options</h3>
              <p className="text-muted-foreground text-sm">
                Choose from various ad formats and placements that suit your budget.
              </p>
            </div>
          </div>
        </div>

        {/* Ad Formats */}
        <div className="mb-16">
          <h2 className="text-3xl font-serif font-bold text-headline text-center mb-10">
            Advertising Options
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-8 border border-divider text-center">
              <h3 className="text-xl font-serif font-bold text-headline mb-4">Banner Ads</h3>
              <p className="text-muted-foreground mb-6">
                Premium placement on our homepage and article pages with high visibility.
              </p>
              <p className="text-2xl font-bold text-primary">From KES 5,000</p>
              <p className="text-sm text-muted-foreground">per week</p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border-2 border-primary text-center relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </span>
              <h3 className="text-xl font-serif font-bold text-headline mb-4">Sponsored Content</h3>
              <p className="text-muted-foreground mb-6">
                Native articles that engage readers while promoting your brand story.
              </p>
              <p className="text-2xl font-bold text-primary">From KES 15,000</p>
              <p className="text-sm text-muted-foreground">per article</p>
            </div>
            <div className="bg-surface rounded-2xl p-8 border border-divider text-center">
              <h3 className="text-xl font-serif font-bold text-headline mb-4">Newsletter Ads</h3>
              <p className="text-muted-foreground mb-6">
                Reach our subscribers directly in their inbox with dedicated placement.
              </p>
              <p className="text-2xl font-bold text-primary">From KES 3,000</p>
              <p className="text-sm text-muted-foreground">per send</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 border border-primary/20 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-headline mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Contact our advertising team to discuss your campaign goals and get a custom quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gradient-primary text-primary-foreground">
              <a href="mailto:contact@thescoopkenya.co.ke">
                <Mail className="w-5 h-5 mr-2" />
                Email Us
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="tel:+254706396305">
                <Phone className="w-5 h-5 mr-2" />
                Call 0706 396 305
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}