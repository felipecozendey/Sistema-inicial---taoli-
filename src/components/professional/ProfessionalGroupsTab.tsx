import { useState, useEffect } from 'react'
import { SocialGroup } from '@/services/social'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreateGroupDialog } from '@/components/social/CreateGroupDialog'
import { GroupDetailView } from '@/components/social/GroupDetailView'
import { Users, Plus, Lock, Globe, Loader2, Crown, Search, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function ProfessionalGroupsTab() {
  const { user } = useAuth()
  const { groups, loadingGroups, loadGroups } = useSocialStore()

  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user?.id) {
      // filter 'my' to fetch groups created or joined by the user
      loadGroups(user.id, 'my')
    }
  }, [user?.id, loadGroups])

  // Strictly filter groups created by this professional (groups.created_by = auth.uid())
  const myCreatedGroups = groups.filter((g) => g.created_by === user?.id)

  const filtered = myCreatedGroups.filter((g) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      g.name.toLowerCase().includes(q) || (g.description && g.description.toLowerCase().includes(q))
    )
  })

  // If a group is selected, render the reused GroupDetailView with Pro back action
  if (selectedGroupId) {
    return (
      <GroupDetailView
        groupId={selectedGroupId}
        onBack={() => {
          setSelectedGroupId(null)
          if (user?.id) loadGroups(user.id, 'my')
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header / Intro banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-lg text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-[#58CC02]" />
              Grupos Pro do Consultório
            </h3>
            <Badge className="bg-[#58CC02] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
              Exclusivo Pro
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Comunidades criadas por você com enquetes com relatório, fixação de postagens, tags e
            administração de membros.
          </p>
        </div>

        <Button
          onClick={() => setCreateGroupOpen(true)}
          className="rounded-2xl h-11 px-5 font-black bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white shadow-sm flex items-center gap-2 cursor-pointer active:translate-y-0.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Grupo</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar entre seus grupos criados..."
          className="pl-9 rounded-2xl border-2 h-11 text-xs font-semibold"
        />
      </div>

      {/* Groups Grid */}
      {loadingGroups ? (
        <div className="py-14 text-center space-y-2">
          <Loader2 className="w-8 h-8 text-[#58CC02] animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">Carregando seus grupos Pro...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl border-2 bg-card text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center mx-auto text-2xl">
            🌱
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-foreground">
              {searchQuery ? 'Nenhum grupo encontrado' : 'Nenhum grupo criado ainda'}
            </h4>
            <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto">
              Crie comunidades temáticas para seus pacientes ou clientes com enquetes, fixação de
              postagens e relatórios de engajamento.
            </p>
          </div>
          {!searchQuery && (
            <Button
              onClick={() => setCreateGroupOpen(true)}
              className="rounded-2xl h-10 px-5 font-black bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white text-xs cursor-pointer active:translate-y-0.5 mx-auto"
            >
              Criar meu primeiro grupo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className="bg-card rounded-3xl border-2 overflow-hidden shadow-xs hover:border-[#58CC02] hover:shadow-md transition-all cursor-pointer flex flex-col group"
            >
              {/* Cover */}
              <div className="h-28 w-full bg-gradient-to-r from-[#58CC02]/20 via-[#1CB0F6]/20 to-[#CE82FF]/20 relative">
                {group.cover_url ? (
                  <img
                    src={group.cover_url}
                    alt={group.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#58CC02]">
                    <Users className="w-10 h-10 opacity-70" />
                  </div>
                )}

                {/* Privacy Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    variant="outline"
                    className="bg-background/90 backdrop-blur-sm text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs"
                  >
                    {group.is_closed ? (
                      <>
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>Fechado</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 text-[#1CB0F6]" />
                        <span>Aberto</span>
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-extrabold text-sm sm:text-base text-foreground group-hover:text-[#58CC02] transition-colors line-clamp-1">
                      {group.name}
                    </h4>
                    <Badge className="bg-[#CE82FF] text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0">
                      <Crown className="w-2.5 h-2.5" /> Dono
                    </Badge>
                  </div>

                  {group.description && (
                    <p className="text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#58CC02]" />
                    {group.members_count || 1} membro(s)
                  </span>
                  <span className="text-[#1CB0F6] flex items-center gap-0.5 group-hover:underline">
                    <Sparkles className="w-3 h-3" /> Abrir painel
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação de Grupo existente reaproveitado */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onSuccess={(createdGroupId) => {
          if (user?.id) loadGroups(user.id, 'my')
          setSelectedGroupId(createdGroupId)
        }}
      />
    </div>
  )
}
