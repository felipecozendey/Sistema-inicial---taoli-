import { useState } from 'react'
import { useAppStore, PersonalRecord } from '@/stores/useAppStore'
import { Pencil, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

const PR_FIELDS: { key: keyof PersonalRecord; label: string; emoji: string }[] = [
  { key: 'benchPress', label: 'Peso máx. no Supino', emoji: '🏋️' },
  { key: 'squat', label: 'Agachamento', emoji: '🦵' },
  { key: 'runTime', label: 'Tempo de Corrida', emoji: '🏃' },
]

export function PersonalRecords() {
  const { personalRecords, updatePersonalRecords } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<PersonalRecord>(personalRecords)

  const handleSave = () => {
    updatePersonalRecords(draft)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(personalRecords)
    setEditing(false)
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[#FFC800]/15 flex items-center justify-center">
            <span className="text-xl">🏆</span>
          </div>
          <h3 className="text-lg font-extrabold">Recordes Pessoais</h3>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={handleSave}
              className="p-2 rounded-xl bg-[#58CC02] text-white hover:opacity-90 transition-opacity"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setDraft(personalRecords)
              setEditing(true)
            }}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {PR_FIELDS.map((field) => (
          <div key={field.key} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40">
            <span className="text-xl">{field.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-muted-foreground">{field.label}</p>
              {editing ? (
                <Input
                  value={draft[field.key]}
                  onChange={(e) => setDraft((p) => ({ ...p, [field.key]: e.target.value }))}
                  className="h-7 mt-1 rounded-lg bg-background font-bold text-sm"
                  placeholder="—"
                />
              ) : (
                <p className="text-sm font-extrabold">{personalRecords[field.key] || '—'}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
