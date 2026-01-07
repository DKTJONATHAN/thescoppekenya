import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Youtube } from "lucide-react";
import { XIcon } from "@/components/XIcon";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:contact@thescoopkenya.co.ke?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
    window.location.href = mailtoLink;
  };

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-headline mb-4">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a story tip, question, or want to collaborate? We'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-headline mb-1">Phone</h3>
                  <a href="tel:+254706396305" className="text-muted-foreground hover:text-primary transition-colors">
                    0706 396 305
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-headline mb-1">Email</h3>
                  <a href="mailto:contact@thescoopkenya.co.ke" className="text-muted-foreground hover:text-primary transition-colors block">
                    contact@thescoopkenya.co.ke
                  </a>
                  <a href="mailto:info@jonathanmwaniki.co.ke" className="text-muted-foreground hover:text-primary transition-colors block">
                    info@jonathanmwaniki.co.ke
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-headline mb-1">Location</h3>
                  <p className="text-muted-foreground">
                    Nairobi, Kenya
                  </p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-surface rounded-2xl p-6 border border-divider">
              <h3 className="font-serif font-bold text-headline mb-4">Follow Us</h3>
              <div className="flex gap-3">
                <a href="https://facebook.com/thescoopkenya" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://x.com/thescoopkenya" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <XIcon className="w-5 h-5" />
                </a>
                <a href="https://instagram.com/thescoopkenya" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://youtube.com/@thescoopkenya" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-8 border border-divider">
              <h2 className="text-2xl font-serif font-bold text-headline mb-6">Send us a Message</h2>
              
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="How can we help?"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Tell us more..."
                />
              </div>

              <Button type="submit" className="w-full gradient-primary text-primary-foreground py-6 text-lg font-bold">
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}