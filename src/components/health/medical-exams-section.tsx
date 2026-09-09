import { useRef, useState, useEffect } from 'react'
import { useAppStore, type MedicalExam } from '@/stores/useAppStore'
import { GameButton } from '@/components/ui/game-button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { uploadImage } from '@/lib/image-upload'
import { safeFormatDateLong, todayStr } from '@/lib/date-utils'
import { toast } from 'sonner'
import { ptBR } from 'date-fns/locale'
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Pencil,
  Calendar as CalendarIcon,
} from 'lucide-react'

function dateToYmd(d: Date): string {
  const safe = d instanceof Date && !isNaN(d.getTime()) ? d : new Date()
  const y = safe.getFullYear()
  const m = String(safe.getMonth() + 1).padStart(2, '0')
  const day = String(safe.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ymdToDate(s?: string): Date {
  if (!s) return new Date()
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

export function MedicalExamsSection() {
  const { medicalExams, fetchMedicalExams, addMedicalExam, updateMedicalExam, deleteMedicalExam } =
    useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceFileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)

  // Modal para NOVO exame
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState<Date>(new Date())

  // Modal para EDITAR exame
  const [editOpen, setEditOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<MedicalExam | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState<Date>(new Date())
  const [editFileUrl, setEditFileUrl] = useState('')
  const [replacingFile, setReplacingFile] = useState(false)

  useEffect(() => {
    fetchMedicalExams()
  }, [fetchMedicalExams])

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    setNewTitle(baseName || file.name)
    setNewDate(new Date())
    setCreateOpen(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCreateSubmit = async () => {
    if (!pendingFile) return
    if (!newTitle.trim()) {
      toast.error('Informe um título para o exame.')
      return
    }
    setUploading(true)
    try {
      const url = await uploadImage(pendingFile)
      const dateStr = dateToYmd(newDate)
      addMedicalExam(newTitle.trim(), url, dateStr)
      setCreateOpen(false)
      setPendingFile(null)
      setNewTitle('')
    } catch {
      toast.error('Erro ao enviar exame')
    } finally {
      setUploading(false)
    }
  }

  const handleOpenEdit = (exam: MedicalExam) => {
    setEditingExam(exam)
    setEditTitle(exam.title)
    setEditDate(ymdToDate(exam.date))
    setEditFileUrl(exam.fileUrl || '')
    setEditOpen(true)
  }

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReplacingFile(true)
    try {
      const url = await uploadImage(file)
      setEditFileUrl(url)
      toast.success('Arquivo atualizado! Salve as alterações.')
    } catch {
      toast.error('Erro ao enviar novo arquivo.')
    } finally {
      setReplacingFile(false)
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = ''
    }
  }

  const handleSaveEdit = () => {
    if (!editingExam) return
    if (!editTitle.trim()) {
      toast.error('Informe um título válido.')
      return
    }
    const finalDateStr = dateToYmd(editDate)
    updateMedicalExam(editingExam.id, {
      title: editTitle.trim(),
      date: finalDateStr,
      fileUrl: editFileUrl || undefined,
    })
    setEditOpen(false)
    setEditingExam(null)
  }

  return (
    <div className="bg-card border-2 border-b-4 border-[#E5E5E5] dark:border-[#3B4A55] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[#FF4B4B]/15 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#FF4B4B]" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-extrabold">Exames Médicos</h3>
        </div>
        <GameButton
          onClick={() => fileInputRef.current?.click()}
          variant="primary"
          size="sm"
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-1" strokeWidth={2.5} />
          {uploading ? 'Enviando...' : 'Upload'}
        </GameButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFilePicked}
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {medicalExams.length === 0 ? (
        <div className="bg-muted/30 border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] rounded-2xl p-8 text-center space-y-2">
          <span className="text-3xl block">📄</span>
          <p className="text-sm font-bold text-muted-foreground">
            Nenhuma avaliação ainda. Registre sua primeira medida!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {medicalExams.map((exam) => (
            <div
              key={exam.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FF4B4B]/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-[#FF4B4B]" strokeWidth={2} />
              </div>
              <button
                onClick={() => exam.fileUrl && window.open(exam.fileUrl, '_blank')}
                className="flex-1 text-left min-w-0"
              >
                <p className="text-sm font-extrabold truncate">{exam.title}</p>
                <p className="text-xs text-muted-foreground font-bold">
                  {safeFormatDateLong(exam.date)}
                </p>
              </button>
              {exam.fileUrl && (
                <a
                  href={exam.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
                  title="Abrir arquivo"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                </a>
              )}
              <button
                onClick={() => handleOpenEdit(exam)}
                className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
                title="Editar exame"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => deleteMedicalExam(exam.id)}
                className="p-2 rounded-xl hover:bg-[#FF4B4B]/10 transition-colors shrink-0"
                title="Excluir exame"
              >
                <Trash2 className="w-4 h-4 text-[#FF4B4B]" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação com Data e Título */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF4B4B]" /> Novo Exame Médico
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="font-bold text-sm">Título do Exame</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Hemograma Completo"
                className="rounded-2xl border-2 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-sm">Data do Exame</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-card border-2 font-bold text-sm hover:bg-muted/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      {safeFormatDateLong(dateToYmd(newDate))}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={(d) => d && setNewDate(d)}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {pendingFile && (
              <p className="text-xs text-muted-foreground font-semibold truncate">
                Arquivo: {pendingFile.name} ({(pendingFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
            <GameButton
              onClick={handleCreateSubmit}
              disabled={uploading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {uploading ? 'Enviando...' : 'Salvar Exame'}
            </GameButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição (Título + Data + Trocar Arquivo) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#1CB0F6]" /> Editar Exame Médico
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="font-bold text-sm">Título do Exame</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ex: Hemograma Completo"
                className="rounded-2xl border-2 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-sm">Data do Exame</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-card border-2 font-bold text-sm hover:bg-muted/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      {safeFormatDateLong(dateToYmd(editDate))}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={(d) => d && setEditDate(d)}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-sm">Arquivo Anexado</Label>
              <div className="flex items-center gap-2">
                <GameButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => replaceFileInputRef.current?.click()}
                  disabled={replacingFile}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {replacingFile
                    ? 'Enviando...'
                    : editFileUrl
                      ? 'Substituir Arquivo'
                      : 'Adicionar Arquivo'}
                </GameButton>
                {editFileUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(editFileUrl, '_blank')}
                    className="p-2.5 rounded-2xl border-2 hover:bg-muted transition-colors shrink-0"
                    title="Visualizar arquivo"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <GameButton
              onClick={handleSaveEdit}
              disabled={replacingFile}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Salvar Alterações
            </GameButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
