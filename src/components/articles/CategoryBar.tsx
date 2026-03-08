import { Link } from "react-router-dom";
import { categories } from "@/lib/markdown";

export function CategoryBar() {
  return (
    <section className="py-4 border-b border-divider bg-background">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <Link
            to="/"
            className="flex-shrink-0 px-4 py-2 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all"
          >
            All Stories
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={category.slug === 'sports' ? '/sports' : `/category/${category.slug}`}
              className="flex-shrink-0 px-4 py-2 bg-background text-foreground text-xs font-black uppercase tracking-wider border border-divider hover:border-primary hover:text-primary transition-all"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
