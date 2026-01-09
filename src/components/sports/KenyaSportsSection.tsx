import { getPostsByCategory } from "@/lib/markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Trophy, Users } from "lucide-react";
import { format } from "date-fns";

export function KenyaSportsSection() {
  // Get sports posts that are Kenya-related
  const sportsPosts = getPostsByCategory("sports");
  const kenyaPosts = sportsPosts.filter(
    (post) =>
      post.title.toLowerCase().includes("kenya") ||
      post.title.toLowerCase().includes("harambee") ||
      post.excerpt?.toLowerCase().includes("kenya") ||
      post.tags?.some((tag) =>
        ["kenya", "harambee stars", "kpl", "kenyan"].includes(tag.toLowerCase())
      )
  );

  // Use all sports posts if no Kenya-specific ones found
  const displayPosts = kenyaPosts.length > 0 ? kenyaPosts : sportsPosts;

  return (
    <div className="space-y-6">
      {/* Kenya Sports Header */}
      <div className="bg-gradient-to-r from-green-600 via-black to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Kenya Sports</h2>
            <p className="text-white/80">Harambee Stars, KPL & More</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <Trophy className="w-6 h-6 mx-auto mb-1" />
            <p className="text-sm font-medium">Harambee Stars</p>
            <p className="text-xs text-white/70">National Team</p>
          </div>
          <div className="text-center">
            <Users className="w-6 h-6 mx-auto mb-1" />
            <p className="text-sm font-medium">KPL</p>
            <p className="text-xs text-white/70">Premier League</p>
          </div>
          <div className="text-center">
            <Calendar className="w-6 h-6 mx-auto mb-1" />
            <p className="text-sm font-medium">AFCON 2025</p>
            <p className="text-xs text-white/70">Qualifiers</p>
          </div>
        </div>
      </div>

      {/* News Articles */}
      {displayPosts.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span>Latest Kenya Sports News</span>
            <Badge variant="secondary">{displayPosts.length} articles</Badge>
          </h3>
          <div className="grid gap-4">
            {displayPosts.slice(0, 6).map((post) => (
              <Link key={post.slug} to={`/article/${post.slug}`}>
                <Card className="hover:shadow-soft transition-smooth hover:border-primary">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground line-clamp-2 mb-2">
                          {post.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(post.date), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Kenya Sports News Yet</h3>
            <p className="text-muted-foreground">
              Check back soon for the latest on Harambee Stars and the Kenyan Premier League.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="font-medium text-sm">Harambee Stars</p>
            <p className="text-xs text-muted-foreground">National Team News</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-red-600" />
            <p className="font-medium text-sm">KPL Updates</p>
            <p className="text-xs text-muted-foreground">League Coverage</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
