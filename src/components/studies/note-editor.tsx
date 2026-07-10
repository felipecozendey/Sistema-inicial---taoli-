import { useState } from 'react'
import { useStudiesStore } from '@/stores/useStudiesStore'
import { RichTextEditor } from '@/components/studies/rich-text-editor'
import { EmojiPicker } from '@/components/studies/emoji-picker'
import { BacklinksSection } from '@/components/studies/backlinks-section'
import { GameButton } from '@/components/ui/game-button'
import { Input } from '@/components/ui/input'
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

  const handleLinkClick = (linkTitle: string) => {
    const existing = notes.find((n) => n.title === linkTitle)
    if (existing) {
      onNavigateToNote(existing.id)
      return
    }
    const id = addNote({
      title: linkTitle,
      content: '',
      emoji: '📝',
      notebookId: notebookId || notebooks[0]?.id || '',
      tags: [],
    })
    onNavigateToNote(id)
  }

  const handleSave = () => {
    if (!title.trim()) return
    if (editNote) updateNote(editNote.id, { title, content, emoji, notebookId, tags })
    else addNote({ title, content, emoji, notebookId, tags })
    onClose()
  }

  const handleDelete = () => {
    if (editNote) deleteNote(editNote.id)
    onClose()
  }

  const addTag = () => {
    if (tagInput.trim()) {
      setTags((p) => [...p, tagInput.trim()])
      setTagInput('')
    }
  }

  const suggestions = notes
    .filter((n) => n.id !== noteId)
    .map((n) => ({ id: n.id, title: n.title, emoji: n.emoji }))
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="flex gap-2 items-center">
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <button
                className="p-2 rounded-xl hover:bg-muted transition-colors"
                aria-label="Configurações"
              >
                <Settings className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-3xl" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Caderno</label>
                  <Select value={notebookId} onValueChange={setNotebookId}>
                    <SelectTrigger className="rounded-2xl font-semibold">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
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
                          {t}
                          <button onClick={() => setTags((p) => p.filter((_, idx) => idx !== i))}>
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
              onClick={handleDelete}
              className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <GameButton variant="primary" size="md" onClick={handleSave}>
            Salvar
          </GameButton>
        </div>
      </div>

      <div className="bg-card rounded-3xl p-6 border space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl flex-shrink-0">{emoji}</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da nota..."
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-2xl font-extrabold placeholder:text-muted-foreground/50"
          />
        </div>
        <RichTextEditor
          key={noteId || 'new'}
          content={content}
          onChange={setContent}
          onLinkClick={handleLinkClick}
          notes={suggestions}
          currentNoteId={noteId}
          placeholder="Escreva sua nota... Use [[ para vincular a outras notas."
        />
      </div>

      <Accordion type="single" collapsible className="bg-card rounded-3xl border">
        <AccordionItem value="backlinks" className="border-0 px-6">
          <AccordionTrigger className="text-sm font-bold text-muted-foreground hover:no-underline">
            Ver Referências
          </AccordionTrigger>
          <AccordionContent>
            {editNote ? (
              <BacklinksSection noteId={editNote.id} onNavigate={onNavigateToNote} />
            ) : (
              <p className="text-sm text-muted-foreground font-semibold">
                Salve a nota para ver as referências (backlinks).
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <FlashcardDialog
        open={flashcardOpen}
        onOpenChange={setFlashcardOpen}
        noteId={editNote?.id ?? null}
      />
    </div>
  )
}
