import { Layout } from "@/components/layout/Layout";
import { getAllPodcastEpisodes } from "@/lib/markdown";
import { Headphones, Calendar, Mic } from "lucide-react";

// Define the type for a podcast episode based on the YAML frontmatter
interface PodcastEpisode {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  audio_url: string;
}

const PodcastPage = () => {
  // getAllPodcastEpisodes returns episodes sorted by date, descending
  const episodes: PodcastEpisode[] = getAllPodcastEpisodes();

  return (
    <Layout>
      <div className="bg-gradient-to-b from-card to-background">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
          <Mic className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-extrabold text-foreground mb-3">
            Za Ndani: The Podcast
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your weekly audio download. Catch up on the top Kenyan news, entertainment, and sports stories with our signature insider analysis.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Headphones className="w-6 h-6 text-primary" />
          All Episodes
        </h2>
        <div className="space-y-8">
          {episodes.length > 0 ? (
            episodes.map((episode) => (
              <article key={episode.slug} className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:border-primary/30 transition-colors duration-300">
                <h3 className="text-2xl font-bold font-serif text-foreground mb-2">
                  {episode.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(episode.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <p className="text-muted-foreground mb-6">{episode.excerpt}</p>
                <audio controls className="w-full rounded-lg" src={episode.audio_url}>
                  Your browser does not support the audio element.
                </audio>
              </article>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed border-border/50 rounded-2xl">
              <p className="font-semibold">No podcast episodes found.</p>
              <p className="text-sm">The first episode should be available soon. Check back later!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PodcastPage;