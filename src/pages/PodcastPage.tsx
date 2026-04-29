import { Layout } from "@/components/layout/Layout";
import { getAllPodcastEpisodes, type PodcastEpisode } from "@/lib/podcasts";
import { Headphones, Calendar, Mic, PlayCircle, Clock } from "lucide-react";

const PodcastPage = () => {
  // getAllPodcastEpisodes returns episodes sorted by date, descending
  const episodes: PodcastEpisode[] = getAllPodcastEpisodes();
  const latestEpisode = episodes.length > 0 ? episodes[0] : null;
  const olderEpisodes = episodes.slice(1);

  return (
    <Layout>
      <div className="relative bg-background overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-primary/20 blur-[100px] rounded-full point-events-none opacity-50" />
        
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 relative z-10">
          <div className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-full bg-primary/10 mb-4 ring-1 ring-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
              <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-sans font-black tracking-tight text-foreground">
              Za Ndani <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-rose-400">Audio.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
              Your weekly raw, unfiltered download of Kenyan entertainment, sports, and news. Hand-picked stories, insider commentary, straight to your ears.
            </p>
          </div>

          {/* Hero Section for Latest Episode */}
          {latestEpisode ? (
            <div className="relative group rounded-3xl overflow-hidden bg-card/80 border border-primary/20 shadow-2xl backdrop-blur-xl mb-24 transition-all duration-500 hover:border-primary/40">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Latest Drop
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                    {latestEpisode.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(latestEpisode.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {latestEpisode.excerpt || "Dive into this week's top stories carefully curated from across the country."}
                  </p>
                  
                  <div className="pt-4 w-full">
                    <audio 
                      controls 
                      className="w-full h-14 rounded-full bg-background border border-border shadow-inner focus:outline-none" 
                      src={latestEpisode.audio_url}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
                
                <div className="hidden md:flex justify-center items-center">
                  <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-primary/20 via-background to-primary/5 group-hover:scale-105 transition-transform duration-700 flex items-center justify-center border-2 border-primary/10 border-dashed">
                    <div className="absolute inset-0 rounded-full animate-[spin_20s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 0 340deg, theme(colors.primary.DEFAULT) 360deg)' }}></div>
                    <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center z-10 shadow-2xl">
                      <Headphones className="w-24 h-24 text-primary/40 group-hover:text-primary transition-colors duration-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 bg-card/50 rounded-3xl border border-dashed border-border mb-16 shadow-inner">
              <Headphones className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Episodes Yet</h3>
              <p className="text-muted-foreground">The premier episode of Za Ndani Audio drops this Sunday at 08:00 UTC. Stay tuned!</p>
            </div>
          )}

          {/* Older Episodes Archive */}
          {olderEpisodes.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-4">
                <Clock className="w-6 h-6 text-primary" />
                <h3 className="text-3xl font-bold tracking-tight">The Archive</h3>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                {olderEpisodes.map((episode) => (
                  <article key={episode.slug} className="group flex flex-col bg-card/60 backdrop-blur-sm p-6 rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(episode.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {episode.title}
                      </h4>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-6">
                        {episode.excerpt}
                      </p>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-border/50">
                      <audio 
                        controls 
                        className="w-full h-10 rounded-full bg-background" 
                        src={episode.audio_url}
                      >
                      </audio>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PodcastPage;