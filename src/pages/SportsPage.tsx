import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeagueSelector } from "@/components/sports/LeagueSelector";
import { LiveScoresWidget } from "@/components/sports/LiveScoresWidget";
import { FixturesList } from "@/components/sports/FixturesList";
import { StandingsTable } from "@/components/sports/StandingsTable";
import { AIHeadlinesBanner } from "@/components/sports/AIHeadlinesBanner";
import { SportsNewsFeed } from "@/components/sports/SportsNewsFeed";
import { KenyaSportsSection } from "@/components/sports/KenyaSportsSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Match, useMatchPreview, useMatchReview, usePreloadSportsData } from "@/hooks/useSportsData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Activity, Calendar, Trophy, Newspaper, Flame, TrendingUp, Radio } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function SportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLeague = searchParams.get("league") || "KPL";
  const [selectedLeague, setSelectedLeague] = useState(initialLeague);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [aiContent, setAiContent] = useState<{ headline: string; content: string } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const previewMutation = useMatchPreview();
  const reviewMutation = useMatchReview();

  usePreloadSportsData();

  useEffect(() => {
    setSearchParams({ league: selectedLeague }, { replace: true });
  }, [selectedLeague, setSearchParams]);

  const handleLeagueSelect = (code: string) => {
    setSelectedLeague(code);
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    setAiContent(null);
  };

  const generateAIContent = async () => {
    if (!selectedMatch) return;
    setIsGeneratingAI(true);
    try {
      const isFinished = selectedMatch.status === 'FINISHED';
      const result = isFinished 
        ? await reviewMutation.mutateAsync(selectedMatch)
        : await previewMutation.mutateAsync(selectedMatch);
      setAiContent(result);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const isKenyaSelected = selectedLeague === "KPL";

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani Sports | Live Scores, KPL Updates & AI Match Analysis</title>
        <meta name="description" content="Professional Kenya sports coverage: Harambee Stars, KPL fixtures, Athletics, and AI-powered match previews. Real-time data and insider reporting." />
      </Helmet>

      {/* Live Ticker Bar */}
      <div className="bg-headline text-white py-3">
        <div className="container max-w-7xl mx-auto px-4 flex items-center gap-6">
          <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-primary text-[10px] font-black uppercase tracking-tighter">
            <Radio className="w-3 h-3 animate-pulse" />
            Live Now
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs md:text-sm font-medium animate-in fade-in slide-in-from-right duration-1000">
              Gor Mahia vs AFC Leopards: AI Match Review Available • Harambee Stars Training Updates • KPL Standings Updated
            </p>
          </div>
          <Link to="/sports/live" className="text-xs font-bold text-primary hover:underline underline-offset-4 flex items-center gap-1">
            All Scores <Activity className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <main className="py-12 md:py-20 bg-[#F9FAFB] dark:bg-transparent">
        <div className="container max-w-7xl mx-auto px-4">
          
          {/* Section Header */}
          <div className="max-w-4xl mb-12">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-[0.2em] mb-4">
              <Trophy className="w-4 h-4" />
              <span>The Arena</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-black text-headline tracking-tight mb-6">
              Sports <span className="text-primary italic">Intelligence.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Real-time data meets deep-source journalism. Track the Kenya Premier League, 
              global football, and Kenyan athletics with AI-driven tactical insights.
            </p>
          </div>

          <div className="mb-12">
            <LeagueSelector 
              selected={selectedLeague} 
              onSelect={handleLeagueSelect} 
            />
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-10">
              <AIHeadlinesBanner />

              {isKenyaSelected ? (
                <KenyaSportsSection />
              ) : (
                <Tabs defaultValue="fixtures" className="w-full">
                  <TabsList className="flex gap-2 bg-transparent h-auto p-0 mb-8 border-b border-divider w-full justify-start rounded-none">
                    <TabsTrigger value="fixtures" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 font-bold text-sm">
                      Fixtures & Results
                    </TabsTrigger>
                    <TabsTrigger value="standings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 font-bold text-sm">
                      League Table
                    </TabsTrigger>
                    <TabsTrigger value="news" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 font-bold text-sm">
                      Breaking News
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="fixtures" className="focus-visible:ring-0">
                    <FixturesList competition={selectedLeague} onMatchClick={handleMatchClick} />
                  </TabsContent>

                  <TabsContent value="standings">
                    <StandingsTable competition={selectedLeague} />
                  </TabsContent>

                  <TabsContent value="news">
                    <SportsNewsFeed />
                  </TabsContent>
                </Tabs>
              )}
            </div>

            {/* Sidebar Widgets */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-24 space-y-8">
                
                {/* Live Scores Panel */}
                <div className="bg-surface rounded-[2rem] border border-divider shadow-xl overflow-hidden">
                  <div className="bg-headline p-6 flex items-center justify-between">
                    <h2 className="text-white font-bold tracking-tight">Match Center</h2>
                    <Badge className="bg-primary/20 text-primary border-0">Live</Badge>
                  </div>
                  <div className="p-2">
                    <LiveScoresWidget />
                  </div>
                </div>

                {/* AI Feature Promo */}
                <div className="relative group overflow-hidden bg-primary rounded-[2rem] p-8 text-primary-foreground shadow-2xl">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-3 leading-tight text-white">
                      The Next Level of Analysis.
                    </h3>
                    <p className="text-white/80 text-sm mb-6 leading-relaxed">
                      Select any match to generate a data-backed AI preview or tactical review instantly.
                    </p>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-white/60">
                      <Activity className="w-3 h-3" />
                      Proprietary AI Engine
                    </div>
                  </div>
                  {/* Decorative element */}
                  <Flame className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 group-hover:scale-120 transition-transform duration-500" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Match Detail Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-divider shadow-2xl bg-surface">
          {selectedMatch && (
            <>
              <div className="bg-headline p-10 text-white text-center">
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                  Match Intelligence
                </p>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1 flex flex-col items-center gap-3">
                    {selectedMatch.homeTeam.crest && (
                      <img src={selectedMatch.homeTeam.crest} alt="" className="w-16 h-16 object-contain" />
                    )}
                    <span className="font-bold text-sm tracking-tight">{selectedMatch.homeTeam.name}</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-black mb-2">
                      {selectedMatch.score.fullTime?.home ?? '0'} : {selectedMatch.score.fullTime?.away ?? '0'}
                    </span>
                    <Badge variant="outline" className="text-white/60 border-white/20">
                      {selectedMatch.status === 'FINISHED' ? 'Full Time' : 'Upcoming'}
                    </Badge>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-3">
                    {selectedMatch.awayTeam.crest && (
                      <img src={selectedMatch.awayTeam.crest} alt="" className="w-16 h-16 object-contain" />
                    )}
                    <span className="font-bold text-sm tracking-tight">{selectedMatch.awayTeam.name}</span>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground uppercase font-bold tracking-widest">
                  <span>{selectedMatch.competition.name}</span>
                  <span className="w-1 h-1 bg-divider rounded-full" />
                  <span>Matchday {selectedMatch.matchday}</span>
                </div>

                {!aiContent ? (
                  <Button 
                    onClick={generateAIContent} 
                    disabled={isGeneratingAI}
                    className="w-full h-16 rounded-2xl gradient-primary text-primary-foreground font-bold text-lg shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    {isGeneratingAI ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Data...</>
                    ) : (
                      <><Sparkles className="w-5 h-5 mr-2" /> Generate Tactical {selectedMatch.status === 'FINISHED' ? 'Review' : 'Preview'}</>
                    )}
                  </Button>
                ) : (
                  <div className="bg-muted/30 rounded-3xl p-8 border border-divider animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="text-xs font-black text-primary uppercase tracking-widest">
                        AI Insights Engine
                      </span>
                    </div>
                    <h4 className="text-2xl font-serif font-bold text-headline mb-4">{aiContent.headline}</h4>
                    <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {aiContent.content}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}