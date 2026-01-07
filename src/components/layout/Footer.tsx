import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/markdown";
import { XIcon } from "@/components/XIcon";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      {/* Newsletter Section */}
      <div className="border-b border-background/10">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-serif font-bold mb-3">
              Never Miss a Story
            </h3>
            <p className="text-background/70 mb-6">
              Get the hottest news, gossip, and entertainment updates delivered straight to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-background/10 border border-background/20 rounded-lg text-background placeholder:text-background/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
            <Link to="/" className="flex items-center mb-4">
              <h2 className="text-2xl font-serif font-bold">
                The Scoop <span className="text-primary">KE</span>
              </h2>
            </Link>
            <p className="text-background/70 text-sm mb-4">
              Kenya's premier destination for breaking news, entertainment, and celebrity gossip. Stay informed, stay entertained.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://facebook.com/thescoopkenya" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://x.com/thescoopkenya" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth" aria-label="X">
                <XIcon className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/thescoopkenya" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com/@thescoopkenya" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-smooth" aria-label="Youtube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">Categories</h4>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="text-background/70 hover:text-primary transition-colors text-sm"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-background/70 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-background/70 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/advertise" className="text-background/70 hover:text-primary transition-colors">
                  Advertise With Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-background/70 hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-background/70 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-background/70 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-primary" />
                <a href="tel:+254706396305" className="text-background/70 hover:text-primary transition-colors">
                  0706 396 305
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <a href="mailto:contact@thescoopkenya.co.ke" className="text-background/70 hover:text-primary transition-colors">
                  contact@thescoopkenya.co.ke
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-primary" />
                <a href="mailto:info@jonathanmwaniki.co.ke" className="text-background/70 hover:text-primary transition-colors">
                  info@jonathanmwaniki.co.ke
                </a>
              </li>
              <li className="text-background/70 pt-2">
                <span className="text-primary font-medium">Affiliated with:</span>
                <br />
                <a 
                  href="https://www.jonathanmwaniki.co.ke" 
                  target="_blank" 
                  rel="noopener noreferrer"
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
      <div className="border-t border-background/10">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-background/60">
          <p>© {new Date().getFullYear()} The Scoop Kenya. All rights reserved.</p>
          <p>
            A <a href="https://www.jonathanmwaniki.co.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Jonathan Mwaniki</a> Project
          </p>
        </div>
      </div>
    </footer>
  );
}
