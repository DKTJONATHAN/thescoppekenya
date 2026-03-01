import { Link, useNavigate } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, ArrowRight, Phone } from "lucide-react";
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
              Usikose Story Yoyote
            </h3>
            <p className="text-muted-foreground mb-6">
              Pata insider news, gossip, na entertainment updates moja kwa moja kwa inbox yako.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
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
          {/* Brand */}
          <div className="lg:col-span-1">
            <button onClick={() => handleLinkClick("/")} className="mb-4">
              <img src={logoImg} alt="Za Ndani" className="h-12 w-auto" />
            </button>
            <p className="text-muted-foreground text-sm mb-4">
              Kenya's boldest news and entertainment website. Breaking news, gossip, and trending stories — bold, unbiased updates daily.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://facebook.com/zandanike" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth text-foreground" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://x.com/zandani_ke" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth text-foreground" aria-label="X">
                <XIcon className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/zandani_ke" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth text-foreground" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com/@zandanike" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth text-foreground" aria-label="Youtube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-foreground">Categories</h4>
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
            <h4 className="font-serif font-bold text-lg mb-4 text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => handleLinkClick("/about")} className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick("/contact")} className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick("/advertise")} className="text-muted-foreground hover:text-primary transition-colors">
                  Advertise With Us
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick("/careers")} className="text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick("/privacy")} className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick("/terms")} className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-foreground">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-primary" />
                <a href="tel:+254706396305" className="text-muted-foreground hover:text-primary transition-colors">
                  0706 396 305
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <a href="mailto:contact@zandani.co.ke" className="text-muted-foreground hover:text-primary transition-colors">
                  contact@zandani.co.ke
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <a href="mailto:info@jonathanmwaniki.co.ke" className="text-muted-foreground hover:text-primary transition-colors">
                  info@jonathanmwaniki.co.ke
                </a>
              </li>
              <li className="text-muted-foreground pt-2">
                <span className="text-primary font-medium">Affiliated with:</span>
                <br />
                <a 
                  href="https://www.jonathanmwaniki.co.ke" 
                  target="_blank"
                  className="hover:text-primary transition-colors"
                >
                  www.jonathanmwaniki.co.ke
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Za Ndani. All rights reserved.</p>
          <p>
            <a href="https://jonathanmwaniki.co.ke/about" target="_blank" className="text-primary hover:underline">A Jonathan Mwaniki Project</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
