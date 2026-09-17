import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useSocialStore } from '@/stores/useSocialStore'
import { useAuth } from '@/hooks/use-auth'
import { Search, Users, UserPlus, UserCheck, Loader2 } from 'lucide-react'

export function UserSearchSection() {
  const { user } = useAuth()
  const { searchResults, loadingSearch, search, toggleFollow } = useSocialStore()
  const [query, setQuery] = useState('')

  useEffect(() => {
    search(query, user?.id)
  }, [query, user?.id, search])

  return (
    <div className="bg-card rounded-3xl border-2 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-[#1CB0F6]" />
          Descobrir Pessoas
        </h2>
        <span className="text-[11px] font-bold text-muted-foreground">
          {query.trim() ? 'Resultados' : 'Sugestões'}
        </span>
      </div>

      {/* Input de busca */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou @username..."
          className="rounded-2xl h-11 pl-9 font-semibold border-2 bg-muted/40"
        />
        {loadingSearch && (
          <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results List */}
      <div className="divide-y divide-border/60 max-h-[360px] overflow-y-auto pr-1">
        {searchResults.length === 0 && !loadingSearch ? (
          <div className="text-center py-6 text-xs font-semibold text-muted-foreground">
            {query.trim()
              ? 'Nenhum usuário encontrado com esse nome ou @.'
              : 'Nenhuma sugestão no momento.'}
          </div>
        ) : (
          searchResults.map((u) => {
            const isMe = user && user.id === u.id
            return (
              <div
                key={u.id}
                className="flex items-center justify-between py-3 gap-3 transition-colors"
              >
                <Link
                  to={`/u/@${u.username}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border-2 shrink-0">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.display_name || u.username}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#58CC02]/20 text-[#58CC02] font-black text-sm">
                        {(u.display_name || u.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black truncate text-foreground group-hover:text-primary transition-colors">
                      {u.display_name || u.username}
                    </div>
                    <div className="text-xs font-bold text-[#1CB0F6] truncate">@{u.username}</div>
                  </div>
                </Link>

                {!isMe && user && (
                  <button
                    onClick={() => toggleFollow(u.id, user.id)}
                    className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all active:translate-y-0.5 flex items-center gap-1.5 shrink-0 ${
                      u.is_following
                        ? 'bg-transparent text-foreground border-2 hover:bg-muted'
                        : 'bg-[#58CC02] hover:bg-[#58CC02]/90 border-b-4 border-[#46A302] text-white shadow-sm'
                    }`}
                  >
                    {u.is_following ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Seguindo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Seguir</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
