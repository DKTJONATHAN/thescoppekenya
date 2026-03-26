import { Link, useNavigate } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, ArrowRight, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/markdown";
import { XIcon } from "@/components/XIcon";
import logoImg from "@/assets/logo.png";

export function Footer() {
  const navigate = useNavigate();

  const handleLinkClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-card text-card-foreground border-t border-border">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-serif font-bold mb-3 text-foreground">
              Don't Miss Any Story
            </h3>
            <p className="text-muted-foreground mb-6">
              Get insider news, gossip, and entertainment updates straight to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button className="gradient-primary text-primary-foreground hover:opacity-90 px-6">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Socials */}
          <div className="lg:col-span-1">
            <button onClick={() => handleLinkClick("/")} className="mb-4 block">
              <img src={logoImg} alt="Za Ndani" className="h-12 w-auto" />
            </button>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Kenya's boldest news and entertainment website. Breaking news, gossip, and trending stories — bold, unbiased updates daily.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: <Facebook className="w-4 h-4" />, href: "https://facebook.com/zandanike", label: "Facebook" },
                { icon: <XIcon className="w-4 h-4" />, href: "https://x.com/zandani_ke", label: "X" },
                { icon: <Instagram className="w-4 h-4" />, href: "https://instagram.com/zandani_ke", label: "Instagram" },
                { icon: <Youtube className="w-4 h-4" />, href: "https://youtube.com/@zandanike", label: "Youtube" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-foreground"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-foreground border-l-4 border-primary pl-3">
              Categories
            </h4>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <button
                    onClick={() => handleLinkClick(category.slug === 'sports' ? '/sports' : `/category/${category.slug}`)}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm text-left"
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-foreground border-l-4 border-primary pl-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { name: "About Us", path: "/about" },
                { name: "Contact", path: "/contact" },
                { name: "Advertise With Us", path: "/advertise" },
                { name: "Careers", path: "/careers" },
                { name: "Privacy Policy", path: "/privacy" },
                { name: "Terms of Service", path: "/terms" },
              ].map((link) => (
                <li key={link.path}>
                  <button 
                    onClick={() => handleLinkClick(link.path)} 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section - FIXED */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-foreground border-l-4 border-primary pl-3">
              Contact Us
            </h4>
            <div className="space-y-6 text-sm">
              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <a href="tel:+254706396305" className="text-muted-foreground hover:text-primary transition-colors">
                  0706 396 305
                </a>
              </div>

              {/* General Inquiries */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">Inquiries</span>
                </div>
                <div className="pl-11 flex flex-col gap-1.5">
                  <a href="mailto:contact@zandani.co.ke" className="text-muted-foreground hover:text-primary transition-colors break-all">
                    contact@zandani.co.ke
                  </a>
                  <a href="mailto:info@zandani.co.ke" className="text-muted-foreground hover:text-primary transition-colors break-all">
                    info@zandani.co.ke
                  </a>
                </div>
              </div>

              {/* Management */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">Partnerships</span>
                </div>
                <div className="pl-11 flex flex-col gap-1.5">
                  <a href="mailto:info@jonathanmwaniki.co.ke" className="text-muted-foreground hover:text-primary transition-colors break-all">
                    info@jonathanmwaniki.co.ke
                  </a>
                  <a 
                    href="https://www.jonathanmwaniki.co.ke" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-medium hover:underline mt-1"
                  >
                    Visit Jonathan Mwaniki →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Za Ndani. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Powered by</span>
            <a 
              href="https://jonathanmwaniki.co.ke/about" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary font-medium hover:underline"
            >
              Jonathan Mwaniki
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
