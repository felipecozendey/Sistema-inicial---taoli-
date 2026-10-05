import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeletePatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
  isOffline?: boolean
  onConfirm: () => Promise<void>
}

export function DeletePatientModal({
  open,
  onOpenChange,
  patientName,
  isOffline,
  onConfirm,
}: DeletePatientModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setConfirmText('')
      setDeleting(false)
    }
  }, [open])

  const isValid = confirmText === 'APAGAR'

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isValid || deleting) return
    setDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-lg rounded-3xl border-2 p-6 shadow-2xl space-y-4">
        <AlertDialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
          <AlertDialogTitle className="text-lg sm:text-xl font-black text-foreground leading-tight">
            Apagar {patientName} da sua base de dados?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              Após apagar, TODAS as informações deste paciente serão removidas da sua base de dados
              do Painel Pro — consultas, prontuário, medidas, prescrições e histórico do vínculo.
              Esta ação é irreversível. Os dados pessoais do usuário no aplicativo dele não são
              afetados.
            </p>
            {isOffline && (
              <p className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 font-semibold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Por se tratar de paciente offline (sem aplicativo), a conta interna criada para
                  ele também será excluída permanentemente.
                </span>
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 pt-1">
          <Label className="text-xs font-bold text-foreground">
            Para confirmar, digite <span className="font-black text-rose-600">APAGAR</span> abaixo:
          </Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="APAGAR"
            className="rounded-2xl border-2 h-11 text-xs font-mono font-bold tracking-widest text-center"
            autoFocus
          />
        </div>

        <AlertDialogFooter className="pt-2 gap-2 flex-col-reverse sm:flex-row">
          <AlertDialogCancel
            disabled={deleting}
            className="rounded-2xl h-11 font-bold w-full sm:w-auto"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isValid || deleting}
            className="rounded-2xl h-11 font-black bg-rose-600 hover:bg-rose-700 text-white border-b-4 border-rose-800 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto cursor-pointer"
          >
            {deleting ? 'Apagando da base...' : 'Apagar paciente da base'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
