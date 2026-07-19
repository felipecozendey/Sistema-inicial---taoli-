import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { BELT_STYLES } from '@/components/health/jiu-constants'
import { useAppStore } from '@/stores/useAppStore'

export function JiuBeltModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const updateJiuProfile = useAppStore((s) => s.updateJiuProfile)
  const jiuProfile = useAppStore((s) => s.jiuProfile)
  const [belt, setBelt] = useState('White')
  const [stripes, setStripes] = useState(0)

  useEffect(() => {
    if (open) {
      setBelt(jiuProfile?.belt || 'White')
      setStripes(jiuProfile?.stripes || 0)
    }
  }, [open, jiuProfile])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">Atualizar Graduação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-extrabold">Faixa</label>
            <Select value={belt} onValueChange={setBelt}>
              <SelectTrigger className="rounded-xl font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BELT_STYLES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-extrabold">Graus (0-4)</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setStripes(n)}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-extrabold border-b-4 transition-all',
                    stripes === n
                      ? 'bg-[#1CB0F6] text-white border-[#1899D6]'
                      : 'bg-muted text-muted-foreground border-transparent',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={() => {
              updateJiuProfile({ belt: belt as any, stripes })
              onOpenChange(false)
            }}
            className="w-full py-6 rounded-3xl bg-[#1CB0F6] hover:bg-[#1899D6] text-white font-extrabold border-b-4 border-[#1899D6] active:translate-y-1 active:border-b-0 transition-all"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
