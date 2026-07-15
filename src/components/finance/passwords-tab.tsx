import { useState, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { PasswordModal } from '@/components/finance/password-modal'
import { toast } from 'sonner'
import { Eye, EyeOff, Copy, Trash2, Plus, ExternalLink, Search } from 'lucide-react'

const CATEGORY_ICONS: Record<string, string> = {
  Trabalho: '💼',
  Pessoal: '🏠',
  Financeiro: '💰',
  Social: '👥',
  Outros: '📦',
}

export function PasswordsTab() {
  const passwords = useAppStore((s) => s.passwords)
  const deletePassword = useAppStore((s) => s.deletePassword)
  const [modalOpen, setModalOpen] = useState(false)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return passwords.filter(
      (p) => p.title.toLowerCase().includes(q) || p.username.toLowerCase().includes(q),
    )
  }, [passwords, search])

  const toggleVisible = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password)
    toast.success('Senha copiada! 📋')
  }

  return (
    <div className="space-y-3 pb-24">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar senha..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border font-bold text-sm"
        />
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-3xl p-8 bg-card border text-center">
          <p className="text-muted-foreground font-bold">Nenhuma senha salva ainda. 🔐</p>
        </div>
      ) : (
        filtered.map((p) => (
          <div key={p.id} className="rounded-3xl p-4 bg-card border">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{CATEGORY_ICONS[p.category] || '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.username}</p>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#1CB0F6] font-bold flex items-center gap-1 mt-0.5"
                  >
                    <ExternalLink className="w-3 h-3" /> {p.url}
                  </a>
                )}
              </div>
              <button
                onClick={() => deletePassword(p.id)}
                className="text-muted-foreground hover:text-[#FF4B4B] transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <code className="flex-1 px-3 py-2 rounded-xl bg-muted font-mono text-sm">
                {visibleIds.has(p.id) ? p.password : '••••••••'}
              </code>
              <button
                onClick={() => toggleVisible(p.id)}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
              >
                {visibleIds.has(p.id) ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => copyPassword(p.password)}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-30 flex items-center gap-2 px-5 py-4 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold text-sm border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all duration-150 shadow-lg print:hidden"
      >
        <Plus className="w-5 h-5" strokeWidth={3} />
        Nova Senha
      </button>
      <PasswordModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
