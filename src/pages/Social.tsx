import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useSocialStore } from '@/stores/useSocialStore'
import { PostComposer } from '@/components/social/PostComposer'
import { PostCard } from '@/components/social/PostCard'
import { UserSearchSection } from '@/components/social/UserSearchSection'
import { ProfilePanel } from '@/components/social/profile-panel'
import { GroupCard } from '@/components/social/GroupCard'
import { GroupDetailView } from '@/components/social/GroupDetailView'
import { CreateGroupDialog } from '@/components/social/CreateGroupDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Share2,
  RefreshCw,
  Search,
  Sparkles,
  Loader2,
  UserPlus,
  UserCircle,
  Users,
  Plus,
  Check,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SocialGroup } from '@/services/social'

export default function SocialPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const {
    feedPosts,
    loadingFeed,
    hasMoreFeed,
    loadFeed,
    loadMyProfile,
    groups,
    loadingGroups,
    loadGroups,
    toggleGroupMembership,
  } = useSocialStore()

  // Deep link support via ?tab=perfil | ?tab=grupos | ?tab=feed, plus ?group=groupId
  const tabParam = searchParams.get('tab')?.toLowerCase()
  const initialMainTab =
    tabParam === 'perfil' ? 'profile' : tabParam === 'grupos' ? 'groups' : 'feed'
  const [mainTab, setMainTab] = useState<'feed' | 'groups' | 'profile'>(initialMainTab)

  // Selected group navigation
  const groupParam = searchParams.get('group')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupParam || null)

  // Groups sub-filter: 'my' | 'discover'
  const [groupsFilter, setGroupsFilter] = useState<'my' | 'all'>('my')
  const [groupsSearch, setGroupsSearch] = useState('')
  const [createGroupOpen, setCreateGroupOpen] = useState(false)

  // Mobile Sub-tabs inside Feed: Feed / Descobrir
  const [activeFeedSubTab, setActiveFeedSubTab] = useState<'feed' | 'discover'>('feed')

  // Synchronize state with URL search params
  useEffect(() => {
    const currentTab = searchParams.get('tab')?.toLowerCase()
    if (currentTab === 'perfil' && mainTab !== 'profile') {
      setMainTab('profile')
    } else if (currentTab === 'grupos' && mainTab !== 'groups') {
      setMainTab('groups')
    } else if (currentTab === 'feed' && mainTab !== 'feed') {
      setMainTab('feed')
    }

    const currentGroup = searchParams.get('group')
    if (currentGroup !== selectedGroupId) {
      setSelectedGroupId(currentGroup)
    }
  }, [searchParams])

  useEffect(() => {
    if (user?.id) {
      loadMyProfile(user.id)
      loadFeed(user.id, true)
      loadGroups(user.id, groupsFilter, groupsSearch)
    }
  }, [user?.id, loadMyProfile, loadFeed, loadGroups, groupsFilter, groupsSearch])

  const handleRefresh = () => {
    if (user?.id) {
      if (mainTab === 'groups') {
        loadGroups(user.id, groupsFilter, groupsSearch)
      } else {
        loadFeed(user.id, true)
      }
    }
  }

  const handleTabChange = (val: 'feed' | 'groups' | 'profile') => {
    setMainTab(val)
    const nextParams = new URLSearchParams(searchParams)
    if (val === 'profile') {
      nextParams.set('tab', 'perfil')
    } else if (val === 'groups') {
      nextParams.set('tab', 'grupos')
    } else {
      nextParams.set('tab', 'feed')
    }
    setSearchParams(nextParams)
  }

  const handleOpenGroup = (group: SocialGroup) => {
    setSelectedGroupId(group.id)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', 'grupos')
    nextParams.set('group', group.id)
    setSearchParams(nextParams)
  }

  const handleBackFromGroup = () => {
    setSelectedGroupId(null)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('group')
    setSearchParams(nextParams)
    if (user?.id) {
      loadGroups(user.id, groupsFilter, groupsSearch)
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

        {/* Action button */}
        <div className="flex items-center gap-2">
          {mainTab === 'groups' && !selectedGroupId && (
            <Button
              onClick={() => setCreateGroupOpen(true)}
              className="rounded-2xl h-11 px-4 font-black bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white active:translate-y-0.5 active:border-b-0 transition-all text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Grupo</span>
            </Button>
          )}

          {mainTab === 'feed' && (
            <Button
              onClick={handleRefresh}
              disabled={loadingFeed}
              variant="outline"
              className="rounded-2xl h-11 px-4 font-bold border-2 hover:bg-muted active:scale-95 transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#58CC02] ${loadingFeed ? 'animate-spin' : ''}`}
              />
              <span>Atualizar Feed</span>
            </Button>
          )}
        </div>
      </header>

      {/* Tabs Principais do Social: Feed · Grupos · Perfil com Design Duolingo */}
      <Tabs
        value={mainTab}
        onValueChange={(val) => handleTabChange(val as 'feed' | 'groups' | 'profile')}
        className="w-full space-y-6"
      >
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-3 w-full max-w-md h-13 p-1.5 rounded-3xl bg-muted/60 border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] gap-1">
            <TabsTrigger
              value="feed"
              className={cn(
                'rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer',
                'data-[state=active]:bg-[#1CB0F6] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#1899D6] data-[state=active]:shadow-sm',
              )}
            >
              <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span>Feed</span>
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className={cn(
                'rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer',
                'data-[state=active]:bg-[#58CC02] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#46A302] data-[state=active]:shadow-sm',
              )}
            >
              <Users className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              <span>Grupos</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className={cn(
                'rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer',
                'data-[state=active]:bg-[#CE82FF] data-[state=active]:text-white data-[state=active]:border-b-4 data-[state=active]:border-[#A855F7] data-[state=active]:shadow-sm',
              )}
            >
              <UserCircle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
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

        {/* Conteúdo Aba Grupos */}
        <TabsContent value="groups" className="focus-visible:outline-none m-0 space-y-6">
          {selectedGroupId ? (
            <GroupDetailView groupId={selectedGroupId} onBack={handleBackFromGroup} />
          ) : (
            <div className="space-y-6">
              {/* Chips Topo: Meus · Descobrir + Busca + Botão Criar */}
              <div className="bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  {/* Chips Meus / Descobrir */}
                  <div className="flex items-center gap-1.5 bg-muted p-1 rounded-2xl border shrink-0">
                    <button
                      type="button"
                      onClick={() => setGroupsFilter('my')}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer',
                        groupsFilter === 'my'
                          ? 'bg-[#58CC02] text-white shadow-sm border-b-2 border-[#46A302]'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Meus Grupos
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupsFilter('all')}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer',
                        groupsFilter === 'all'
                          ? 'bg-[#1CB0F6] text-white shadow-sm border-b-2 border-[#1899D6]'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Descobrir
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={groupsSearch}
                      onChange={(e) => setGroupsSearch(e.target.value)}
                      placeholder="Buscar grupos por nome..."
                      className="rounded-2xl h-11 pl-9 border-2 font-semibold text-xs bg-muted/30"
                    />
                  </div>

                  {/* Botão Criar Grupo */}
                  <Button
                    onClick={() => setCreateGroupOpen(true)}
                    className="rounded-2xl h-11 px-5 font-black text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white active:translate-y-0.5 active:border-b-0 cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Grupo</span>
                  </Button>
                </div>
              </div>

              {/* Groups Grid / List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#58CC02]" />
                    {groupsFilter === 'my'
                      ? 'Grupos que você participa'
                      : 'Comunidades para explorar'}{' '}
                    ({groups.length})
                  </h2>
                  {loadingGroups && (
                    <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
                    </span>
                  )}
                </div>

                {groups.length === 0 && !loadingGroups ? (
                  <div className="bg-card rounded-3xl border-2 p-8 sm:p-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-[#58CC02]/15 text-[#58CC02] border-2 border-[#58CC02]/30 flex items-center justify-center mx-auto">
                      <Users className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-black text-foreground">
                        {groupsFilter === 'my'
                          ? 'Você ainda não participa de nenhum grupo'
                          : 'Nenhum grupo encontrado'}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
                        {groupsFilter === 'my'
                          ? 'Explore novos grupos na aba Descobrir ou crie o seu para conectar pessoas com objetivos em comum.'
                          : 'Seja o pioneiro e crie uma nova comunidade agora mesmo!'}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                      {groupsFilter === 'my' && (
                        <Button
                          onClick={() => setGroupsFilter('all')}
                          variant="outline"
                          className="rounded-2xl h-11 px-5 font-bold border-2 text-xs"
                        >
                          <Compass className="w-4 h-4 mr-2 text-[#1CB0F6]" />
                          Explorar Grupos
                        </Button>
                      )}
                      <Button
                        onClick={() => setCreateGroupOpen(true)}
                        className="rounded-2xl h-11 px-5 font-black text-xs bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeiro Grupo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        onOpenGroup={handleOpenGroup}
                        onToggleJoin={(g) => toggleGroupMembership(g, user?.id || '')}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Conteúdo Aba Perfil */}
        <TabsContent value="profile" className="focus-visible:outline-none m-0">
          <ProfilePanel onNavigateToFeed={() => handleTabChange('feed')} />
        </TabsContent>
      </Tabs>

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onSuccess={(newId) => {
          setSelectedGroupId(newId)
          const nextParams = new URLSearchParams(searchParams)
          nextParams.set('tab', 'grupos')
          nextParams.set('group', newId)
          setSearchParams(nextParams)
        }}
      />
    </div>
  )
}
