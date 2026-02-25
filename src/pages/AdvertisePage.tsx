import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Zap, Target, Mail, Phone } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function AdvertisePage() {
  return (
    <Layout>
      <Helmet>
        <title>Advertise with Za Ndani | Reach Engaged Kenyan Readers</title>
        <meta
          name="description"
          content="Promote your products, services, business or brand to thousands of daily Kenyan readers. Affordable, targeted advertising options for local businesses."
        />
      </Helmet>

      <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-4">
            Advertise with <span className="text-primary">Za Ndani</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Reach thousands of engaged Kenyan readers every day. Perfect for promoting products, services, events, or your brand across Kenya.
          </p>
        </div>

        {/* Stats - keep or update with real data later */}
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
            Why Advertise With Za Ndani?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif font-bold text-headline mb-2">Engaged Kenyan Audience</h3>
              <p className="text-muted-foreground text-sm">
                Readers actively follow local news, trends, lifestyle — high time-on-site.
              </p>
            </div>
            {/* ... other cards unchanged, but add Kenyan flavor if wanted */}
            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif font-bold text-headline mb-2">Targeted Reach in Kenya</h3>
              <p className="text-muted-foreground text-sm">
                Connect with audiences in Nairobi, Mombasa, Kisumu and across the country.
              </p>
            </div>
            {/* ... */}
          </div>
        </div>

        {/* Ad Formats - slight price realism tweak + note */}
        <div className="mb-16">
          <h2 className="text-3xl font-serif font-bold text-headline text-center mb-10">
            Advertising Options
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Starting prices — custom quotes available based on your goals & duration.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-8 border border-divider text-center">
              <h3 className="text-xl font-serif font-bold text-headline mb-4">Banner Ads</h3>
              <p className="text-muted-foreground mb-6">
                High-visibility spots on homepage and articles.
              </p>
              <p className="text-2xl font-bold text-primary">From KES 5,000</p>
              <p className="text-sm text-muted-foreground">per week</p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border-2 border-primary text-center relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
              <h3 className="text-xl font-serif font-bold text-headline mb-4">Sponsored Content</h3>
              <p className="text-muted-foreground mb-6">
                Native articles that tell your brand story to our readers.
              </p>
              <p className="text-2xl font-bold text-primary">From KES 15,000</p>
              <p className="text-sm text-muted-foreground">per article</p>
            </div>
            <div className="bg-surface rounded-2xl p-8 border border-divider text-center">
              <h3 className="text-xl font-serif font-bold text-headline mb-4">Newsletter Ads</h3>
              <p className="text-muted-foreground mb-6">
                Direct reach to subscribers' inboxes.
              </p>
              <p className="text-2xl font-bold text-primary">From KES 3,000</p>
              <p className="text-sm text-muted-foreground">per send</p>
            </div>
          </div>
        </div>

        {/* CTA - add form suggestion */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 border border-primary/20 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-headline mb-4">
            Ready to Grow Your Brand in Kenya?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Contact our team for a custom proposal, rates, and available slots.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gradient-primary text-primary-foreground">
              <a href="mailto:contact@zandani.co.ke">
                <Mail className="w-5 h-5 mr-2" />
                Email Us Now
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="tel:+254706396305">
                <Phone className="w-5 h-5 mr-2" />
                Call/WhatsApp 0706 396 305
              </a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Or fill out our quick inquiry form (coming soon) to tell us about your campaign!
          </p>
        </div>
      </div>
    </Layout>
  );
}