import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Clock, Mail } from "lucide-react";

const openPositions = [
  {
    title: "Content Writer",
    location: "Remote / Nairobi",
    type: "Full-time",
    description: "We're looking for talented writers who can create engaging content across entertainment, news, and lifestyle topics."
  },
  {
    title: "Social Media Manager",
    location: "Remote",
    type: "Part-time",
    description: "Help us grow our social media presence across X, Instagram, Facebook, and TikTok."
  },
  {
    title: "Freelance Contributor",
    location: "Remote",
    type: "Freelance",
    description: "Have a story to tell? Pitch us your ideas and join our network of freelance contributors."
  }
];

export default function CareersPage() {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-4">
            Join <span className="text-primary">Our Team</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Be part of Kenya's fastest-growing digital news platform. We're always looking for passionate individuals.
          </p>
        </div>

        {/* Why Join Us */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 border border-primary/20 mb-12">
          <h2 className="text-2xl font-serif font-bold text-headline mb-6">Why Work With Us?</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold">1</span>
              </div>
              <div>
                <h3 className="font-bold text-headline mb-1">Remote-First</h3>
                <p className="text-muted-foreground text-sm">Work from anywhere in Kenya. We believe in flexibility.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold">2</span>
              </div>
              <div>
                <h3 className="font-bold text-headline mb-1">Growth Opportunities</h3>
                <p className="text-muted-foreground text-sm">Learn and grow with a team that values development.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <div>
                <h3 className="font-bold text-headline mb-1">Creative Freedom</h3>
                <p className="text-muted-foreground text-sm">Your ideas matter. We encourage innovation and creativity.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold">4</span>
              </div>
              <div>
                <h3 className="font-bold text-headline mb-1">Competitive Pay</h3>
                <p className="text-muted-foreground text-sm">Fair compensation for your valuable contributions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-headline mb-6">Open Positions</h2>
          <div className="space-y-4">
            {openPositions.map((position, index) => (
              <div key={index} className="bg-surface rounded-2xl p-6 border border-divider hover:border-primary/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-headline mb-2">{position.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {position.type}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{position.description}</p>
                  </div>
                  <Button asChild className="gradient-primary text-primary-foreground whitespace-nowrap">
                    <a href={`mailto:contact@thescoopkenya.co.ke?subject=Application: ${position.title}`}>
                      Apply Now
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Application */}
        <div className="bg-surface rounded-2xl p-8 border border-divider text-center">
          <Briefcase className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="text-xl font-serif font-bold text-headline mb-3">Don't See a Fit?</h2>
          <p className="text-muted-foreground mb-6">
            We're always open to hearing from talented individuals. Send us your CV and tell us how you can contribute.
          </p>
          <Button asChild variant="outline">
            <a href="mailto:contact@thescoopkenya.co.ke?subject=General Application">
              <Mail className="w-5 h-5 mr-2" />
              Send General Application
            </a>
          </Button>
        </div>
      </div>
    </Layout>
  );
}