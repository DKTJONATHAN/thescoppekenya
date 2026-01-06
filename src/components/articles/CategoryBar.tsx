import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { categories } from "@/data/posts";

export function CategoryBar() {
  return (
    <section className="py-6 border-b border-divider bg-surface">
      <div className="container">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          <Link
            to="/"
            className="flex-shrink-0 px-4 py-2 gradient-primary text-primary-foreground text-sm font-medium rounded-full shadow-soft hover:opacity-90 transition-smooth"
          >
            All Stories
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="flex-shrink-0 px-4 py-2 bg-background text-foreground text-sm font-medium rounded-full border border-divider hover:border-primary hover:text-primary transition-smooth"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
