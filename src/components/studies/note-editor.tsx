import { useState, useMemo } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { RichTextEditor } from '@/components/studies/rich-text-editor'
import { EmojiPicker } from '@/components/studies/emoji-picker'
import { BacklinksSection } from '@/components/studies/backlinks-section'
import { GameButton } from '@/components/ui/game-button'
import { Input } from '@/components/ui/input'
import { syncNoteReferences } from '@/services/note-references'
import { toast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Layers, Trash2, Settings, X } from 'lucide-react'
import { FlashcardDialog } from '@/components/studies/flashcard-dialog'

interface NoteEditorProps {
  noteId: string | null
  onClose: () => void
  onNavigateToNote: (id: string) => void
  defaultNotebookId?: string
}

export function NoteEditor({
  noteId,
  onClose,
  onNavigateToNote,
  defaultNotebookId,
}: NoteEditorProps) {
  const { notes, notebooks, addNote, updateNote, deleteNote } = useStudiesStore()
  const editNote = noteId ? notes.find((n) => n.id === noteId) : null

  const [prevNoteId, setPrevNoteId] = useState(noteId)
  const [title, setTitle] = useState(() => editNote?.title || '')
  const [content, setContent] = useState(() => editNote?.content || '')
  const [emoji, setEmoji] = useState(() => editNote?.emoji || '📝')
  const [notebookId, setNotebookId] = useState(
    () => editNote?.notebookId || defaultNotebookId || notebooks[0]?.id || '',
  )
  const [tags, setTags] = useState<string[]>(() => editNote?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [flashcardOpen, setFlashcardOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Dialogs
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (prevNoteId !== noteId) {
    setPrevNoteId(noteId)
    if (editNote) {
      setTitle(editNote.title)
      setContent(editNote.content)
      setEmoji(editNote.emoji)
      setNotebookId(editNote.notebookId)
      setTags(editNote.tags || [])
    } else {
      setTitle('')
      setContent('')
      setEmoji('📝')
      setNotebookId(defaultNotebookId || notebooks[0]?.id || '')
      setTags([])
    }
  }

  // Dirty state detection
  const isDirty = useMemo(() => {
    if (!editNote) {
      return title.trim() !== '' || content.trim() !== '' || tags.length > 0
    }
    const tagsChanged =
      JSON.stringify([...tags].sort()) !== JSON.stringify([...(editNote.tags || [])].sort())
    return (
      title !== editNote.title ||
      content !== editNote.content ||
      emoji !== editNote.emoji ||
      notebookId !== editNote.notebookId ||
      tagsChanged
    )
  }, [editNote, title, content, emoji, notebookId, tags])

  const handleRequestClose = () => {
    if (isDirty) {
      setShowExitConfirm(true)
    } else {
      onClose()
    }
  }

  const handleLinkClick = async (linkTitle: string) => {
    const existing = notes.find(
      (n) => n.title.trim().toLowerCase() === linkTitle.trim().toLowerCase(),
    )
    if (existing) {
      onNavigateToNote(existing.id)
      return
    }
    const id = await addNote({
      title: linkTitle,
      content: '',
      emoji: '📝',
      notebookId: notebookId || notebooks[0]?.id || '',
      tags: [],
    })
    if (id) {
      onNavigateToNote(id)
    }
  }

  const handleCreateNote = async (noteTitle: string): Promise<string> => {
    const id = await addNote({
      title: noteTitle,
      content: '',
      emoji: '📝',
      notebookId: notebookId || notebooks[0]?.id || '',
      tags: [],
    })
    return id || ''
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe um título para a sua nota antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      let savedId: string | null = null
      if (editNote) {
        await updateNote(editNote.id, { title, content, emoji, notebookId, tags })
        savedId = editNote.id
      } else {
        savedId = await addNote({ title, content, emoji, notebookId, tags })
      }

      if (savedId) {
        try {
          await syncNoteReferences(savedId, content)
        } catch (e) {
          console.error('Falha ao sincronizar referências:', e)
        }
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (editNote) {
      await deleteNote(editNote.id)
    }
    setShowDeleteConfirm(false)
    onClose()
  }

  const addTag = () => {
    const clean = tagInput.trim().replace(/^#/, '')
    if (clean && !tags.includes(clean)) {
      setTags((p) => [...p, clean])
      setTagInput('')
    }
  }

  const suggestions = useMemo(() => {
    return notes
      .filter((n) => n.id !== noteId)
      .map((n) => ({ id: n.id, title: n.title, emoji: n.emoji }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [notes, noteId])

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleRequestClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>

        <div className="flex gap-2 items-center">
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <button
                className="p-2 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border"
                aria-label="Configurações da nota"
              >
                <Settings className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-3xl border-2 border-b-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Caderno</label>
                  <Select value={notebookId} onValueChange={setNotebookId}>
                    <SelectTrigger className="rounded-2xl font-semibold">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">(Sem caderno)</SelectItem>
                      {notebooks.map((nb) => (
                        <SelectItem key={nb.id} value={nb.id}>
                          {nb.emoji} {nb.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Emoji</label>
                  <EmojiPicker value={emoji} onChange={setEmoji} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Tags</label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                      placeholder="Adicionar tag..."
                      className="rounded-2xl font-semibold"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="shrink-0 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm border-2 border-b-4 border-primary/80 active:translate-y-0.5 active:border-b-2 transition-all"
                    >
                      +
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-bold"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => setTags((p) => p.filter((_, idx) => idx !== i))}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <GameButton
            variant="secondary"
            size="md"
            onClick={() => setFlashcardOpen(true)}
            className="gap-1"
          >
            <Layers className="w-4 h-4" /> Flashcard
          </GameButton>

          {editNote && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-200"
              title="Excluir nota"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          <GameButton variant="primary" size="md" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </GameButton>
        </div>
      </div>

      {/* Main Note Canvas */}
      <div className="bg-card rounded-3xl p-6 border-2 border-b-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl flex-shrink-0 cursor-default select-none">{emoji}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da nota..."
            autoFocus={!editNote}
            className="flex-1 bg-transparent border-none outline-none text-2xl font-extrabold placeholder:text-muted-foreground/50 text-foreground"
          />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((t, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <RichTextEditor
          key={noteId || 'new'}
          content={content}
          onChange={setContent}
          onLinkClick={handleLinkClick}
          onCreateNote={handleCreateNote}
          notes={suggestions}
          currentNoteId={noteId}
          placeholder="Escreva sua nota... Digite [[ para vincular rapidamente a outras notas."
        />
      </div>

      {/* Backlinks Section */}
      <Accordion type="single" collapsible className="bg-card rounded-3xl border-2 border-b-4">
        <AccordionItem value="backlinks" className="border-0 px-6">
          <AccordionTrigger className="text-sm font-bold text-muted-foreground hover:no-underline py-4">
            Ver Referências (Backlinks)
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            {editNote ? (
              <BacklinksSection noteId={editNote.id} onNavigate={onNavigateToNote} />
            ) : (
              <p className="text-sm text-muted-foreground font-semibold">
                Salve a nota primeiro para acompanhar as referências cruzadas.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Flashcard creation linked to this note */}
      <FlashcardDialog
        open={flashcardOpen}
        onOpenChange={setFlashcardOpen}
        noteId={editNote?.id ?? null}
      />

      {/* Exit with unsaved changes confirmation */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="rounded-3xl border-2 border-b-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold">
              Alterações não salvas
            </AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              Você tem modificações não salvas nesta nota. Tem certeza de que deseja sair sem
              salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold border-2 border-b-4">
              Continuar Editando
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-[#FF4B4B] text-white hover:bg-[#FF4B4B]/90 font-bold border-2 border-b-4 border-[#FF4B4B]/80"
              onClick={() => {
                setShowExitConfirm(false)
                onClose()
              }}
            >
              Descartar e Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete note confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-3xl border-2 border-b-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold">Excluir Nota?</AlertDialogTitle>
            <AlertDialogDescription className="font-semibold">
              Esta nota e suas referências serão removidas permanentemente. Os flashcards vinculados
              serão mantidos desvinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-bold border-2 border-b-4">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-[#FF4B4B] text-white hover:bg-[#FF4B4B]/90 font-bold border-2 border-b-4 border-[#FF4B4B]/80"
              onClick={handleDeleteConfirmed}
            >
              Excluir Nota
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
