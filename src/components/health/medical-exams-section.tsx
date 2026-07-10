import { useRef, useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { GameButton } from '@/components/ui/game-button'
import { uploadImage } from '@/lib/image-upload'
import { toast } from 'sonner'
import { FileText, Upload, Trash2, ExternalLink } from 'lucide-react'

export function MedicalExamsSection() {
  const { medicalExams, fetchMedicalExams, addMedicalExam, deleteMedicalExam } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchMedicalExams()
  }, [fetchMedicalExams])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      addMedicalExam(file.name, url)
      toast.success('Exame enviado com sucesso!')
    } catch {
      toast.error('Erro ao enviar exame')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
        onChange={handleUpload}
      />
      {medicalExams.length === 0 ? (
        <p className="text-sm text-muted-foreground font-bold text-center py-4">
          Nenhum exame cadastrado 📄
        </p>
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
                  {new Date(exam.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              </button>
              {exam.fileUrl && (
                <a
                  href={exam.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                </a>
              )}
              <button
                onClick={() => deleteMedicalExam(exam.id)}
                className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
