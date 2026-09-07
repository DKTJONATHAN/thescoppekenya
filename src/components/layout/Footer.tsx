import { Link, useNavigate } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, ArrowRight, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/markdown";
import { staticSitePages } from "@/lib/site-links";
import { XIcon } from "@/components/XIcon";
import logoImg from "@/assets/logo.png";

export function Footer() {
  const navigate = useNavigate();

  const handleLinkClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-card text-card-foreground border-t border-border mt-auto" data-nosnippet>
      <div className="border-b border-border">
        <div className="container py-8 md:py-10">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-xl md:text-2xl font-serif font-bold mb-2 text-foreground">
              Don't Miss Any Story
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              Kenya news, gossip and showbiz — straight to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <Button className="gradient-primary text-primary-foreground hover:opacity-90 px-5 h-12">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="container py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="col-span-2 lg:col-span-1">
            <button onClick={() => handleLinkClick("/")} className="mb-3 block">
              <img src={logoImg} alt="Za Ndani" className="h-10 w-auto" />
            </button>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              Kenya's boldest news and entertainment desk. Local first — gossip, showbiz, sports and politics.
            </p>
            <div className="flex items-center gap-2">
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
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-foreground"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm mb-3 text-foreground border-l-4 border-primary pl-2.5">
              Categories
            </h4>
            <ul className="space-y-1.5">
              {categories.map((category) => (
                <li key={category.slug}>
                  <button
                    onClick={() => handleLinkClick(
                      category.slug === "sports" ? "/sports" :
                      category.slug === "entertainment" ? "/entertainment" :
                      category.slug === "news" ? "/news" :
                      category.slug === "business" ? "/business" :
                      category.slug === "lifestyle" ? "/lifestyle" :
                      `/category/${category.slug}`
                    )}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm text-left py-0.5"
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm mb-3 text-foreground border-l-4 border-primary pl-2.5">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-sm">
              {[
                { name: "About", path: "/about" },
                { name: "Contact", path: "/contact" },
                { name: "Ethics", path: "/ethics" },
                { name: "Corrections", path: "/corrections" },
                { name: "Fact-Check", path: "/fact-check" },
                { name: "Advertise", path: "/advertise" },
                { name: "Privacy", path: "/privacy-policy" },
                { name: "Terms", path: "/terms" },
              ].map((link) => (
                <li key={link.path}>
                  <button onClick={() => handleLinkClick(link.path)} className="text-muted-foreground hover:text-primary transition-colors py-0.5">
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-serif font-bold text-sm mb-3 text-foreground border-l-4 border-primary pl-2.5">
              Contact
            </h4>
            <div className="space-y-3 text-sm">
              <a href="tel:+254706396305" className="flex items-center gap-2.5 text-muted-foreground hover:text-primary">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                0706 396 305
              </a>
              <a href="mailto:contact@zandani.co.ke" className="flex items-center gap-2.5 text-muted-foreground hover:text-primary break-all">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                contact@zandani.co.ke
              </a>
              <a href="https://www.jonathanmwaniki.co.ke" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-xs text-primary font-medium hover:underline">
                <Globe className="w-4 h-4 shrink-0" />
                Engineered by Jonathan Mwaniki
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Za Ndani. All rights reserved.</p>
          <button onClick={() => handleLinkClick("/podcast")} className="text-primary hover:underline">
            Podcast
          </button>
        </div>
      </div>
    </footer>
  );
}
