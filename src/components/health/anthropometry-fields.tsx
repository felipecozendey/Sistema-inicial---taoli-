import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Camera, X, FileUp } from 'lucide-react'
import { uploadImage } from '@/lib/image-upload'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function MeasurementInput({
  label,
  value,
  onChange,
  placeholder,
  step = '0.1',
  required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  step?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-[10px] text-green-500 font-bold">⭐</span>}
      </Label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className={cn(
          'rounded-xl border-2 text-sm',
          required && 'ring-2 ring-green-400/50 border-green-400/50',
        )}
      />
    </div>
  )
}

export function PhotoSlot({
  label,
  photoUrl,
  onUpload,
  onRemove,
}: {
  label: string
  photoUrl: string
  onUpload: (url: string) => void
  onRemove: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onUpload(url)
    } catch {
      toast.error('Erro ao enviar foto')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold text-muted-foreground">{label}</Label>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {photoUrl ? (
        <div className="relative rounded-xl overflow-hidden border-2 aspect-[3/4]">
          <img src={photoUrl} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onRemove}
            className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-[#E5E5E5] dark:border-[#3B4A55] flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          <Camera className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">
            {uploading ? 'Enviando...' : 'Upload'}
          </span>
        </button>
      )}
    </div>
  )
}

export function AttachmentUpload({
  attachments,
  onAdd,
  onRemove,
}: {
  attachments: string[]
  onAdd: (url: string) => void
  onRemove: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      onAdd(url)
    } catch {
      toast.error('Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-xl border-2 border-dashed font-bold"
      >
        <FileUp className="w-4 h-4 mr-2" />
        {uploading ? 'Enviando...' : 'Adicionar Anexo'}
      </Button>
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((url, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-muted/40">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs font-bold truncate hover:underline"
              >
                Anexo {i + 1}
              </a>
              <button
                onClick={() => onRemove(url)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
