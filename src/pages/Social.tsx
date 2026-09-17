import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useSocialStore } from '@/stores/useSocialStore'
import { PostComposer } from '@/components/social/PostComposer'
import { PostCard } from '@/components/social/PostCard'
import { UserSearchSection } from '@/components/social/UserSearchSection'
import { ProfilePanel } from '@/components/social/profile-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Share2, RefreshCw, Search, Sparkles, Loader2, UserPlus, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SocialPage() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { feedPosts, loadingFeed, hasMoreFeed, loadFeed, loadMyProfile } = useSocialStore()

  // Deep link support via ?tab=perfil | ?tab=feed
  const initialMainTab = searchParams.get('tab')?.toLowerCase() === 'perfil' ? 'profile' : 'feed'
  const [mainTab, setMainTab] = useState<'feed' | 'profile'>(initialMainTab)

  // Mobile Sub-tabs inside Feed: Feed / Descobrir
  const [activeFeedSubTab, setActiveFeedSubTab] = useState<'feed' | 'discover'>('feed')

  useEffect(() => {
    if (user?.id) {
      loadMyProfile(user.id)
      loadFeed(user.id, true)
    }
  }, [user?.id, loadMyProfile, loadFeed])

  const handleRefresh = () => {
    if (user?.id) {
      loadFeed(user.id, true)
    }
  }

  const handleLoadMore = () => {
    if (user?.id && !loadingFeed && hasMoreFeed) {
      loadFeed(user.id, false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in-up">
      {/* Header */}
      <header className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] border-2 border-[#58CC02]/30">
              <Share2 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Social
            </h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">
            Compartilhe lembretes, fotos e acompanhe quem você segue
          </p>
        </div>

        {/* Action button (visível na aba feed) */}
        {mainTab === 'feed' && (
          <Button
            onClick={handleRefresh}
            disabled={loadingFeed}
            variant="outline"
            className="rounded-2xl h-11 px-4 font-bold border-2 hover:bg-muted active:scale-95 transition-all text-xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#58CC02] ${loadingFeed ? 'animate-spin' : ''}`} />
            <span>Atualizar Feed</span>
          </Button>
        )}
      </header>

      {/* Tabs Principais do Social: Feed vs Perfil com Design Duolingo */}
      <Tabs
        value={mainTab}
        onValueChange={(val) => setMainTab(val as 'feed' | 'profile')}
        className="w-full space-y-6"
      >
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-2 w-full max-w-xs h-13 p-1.5 rounded-3xl bg-muted/60 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] gap-1">
            <TabsTrigger
              value="feed"
              className={cn(
                'rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200',
                'data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#1899D6] data-[state=active]:shadow-sm',
              )}
            >
              <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              <span>Feed</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className={cn(
                'rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200',
                'data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#46A302] data-[state=active]:shadow-sm',
              )}
            >
              <UserCircle className="w-4 h-4" strokeWidth={2.5} />
              <span>Perfil</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Conteúdo Aba Feed */}
        <TabsContent value="feed" className="focus-visible:outline-none m-0 space-y-6">
          {/* Mobile Sub-tabs: Feed / Descobrir */}
          <div className="md:hidden flex p-1 rounded-2xl bg-muted/60 border-2 gap-1">
            <button
              type="button"
              onClick={() => setActiveFeedSubTab('feed')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeFeedSubTab === 'feed'
                  ? 'bg-[#58CC02] text-white shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Feed
            </button>
            <button
              type="button"
              onClick={() => setActiveFeedSubTab('discover')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeFeedSubTab === 'discover'
                  ? 'bg-[#1CB0F6] text-white shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Descobrir
            </button>
          </div>

          {/* Main Grid: Feed left, Discover right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Composer + Posts Feed */}
            <div
              className={`md:col-span-7 lg:col-span-8 space-y-6 ${
                activeFeedSubTab === 'discover' ? 'hidden md:block' : 'block'
              }`}
            >
              {/* Composer */}
              <PostComposer />

              {/* Feed List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#58CC02]" />
                    Publicações Recentes
                  </h2>
                  {loadingFeed && (
                    <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Atualizando...
                    </span>
                  )}
                </div>

                {feedPosts.length === 0 && !loadingFeed ? (
                  <div className="bg-card rounded-3xl border-2 p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-[#58CC02]/15 text-[#58CC02] border-2 border-[#58CC02]/30 flex items-center justify-center mx-auto">
                      <span className="text-3xl">🌱</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-black text-foreground">
                        Siga alguém para ver o feed ganhar vida!
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold max-w-sm mx-auto">
                        Publique seu primeiro lembrete ou explore pessoas na comunidade para
                        acompanhar suas fotos e mensagens.
                      </p>
                    </div>
                    <Button
                      onClick={() => setActiveFeedSubTab('discover')}
                      className="rounded-2xl h-11 px-5 font-black text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Descobrir Pessoas
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}

                    {/* Load More Button */}
                    {hasMoreFeed && (
                      <div className="text-center pt-2">
                        <Button
                          onClick={handleLoadMore}
                          disabled={loadingFeed}
                          variant="outline"
                          className="rounded-2xl h-11 px-6 font-bold border-2 text-xs hover:bg-muted cursor-pointer"
                        >
                          {loadingFeed ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Carregando...
                            </>
                          ) : (
                            'Carregar mais posts'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: User Discovery / Search */}
            <div
              className={`md:col-span-5 lg:col-span-4 md:sticky md:top-6 ${
                activeFeedSubTab === 'feed' ? 'hidden md:block' : 'block'
              }`}
            >
              <UserSearchSection />
            </div>
          </div>
        </TabsContent>

        {/* Conteúdo Aba Perfil */}
        <TabsContent value="profile" className="focus-visible:outline-none m-0">
          <ProfilePanel onNavigateToFeed={() => setMainTab('feed')} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
