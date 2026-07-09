import { useState, useEffect, useRef, useMemo } from 'react'
import { useStudiesStore, Note } from '@/stores/useStudiesStore'
import { extractLinkTitles, detectAutocompleteQuery } from '@/lib/link-parser'
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
import { ArrowLeft, Layers, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
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

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [emoji, setEmoji] = useState('📝')
  const [notebookId, setNotebookId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [autoOpen, setAutoOpen] = useState(false)
  const [autoQuery, setAutoQuery] = useState('')
  const [autoIndex, setAutoIndex] = useState(0)
  const [flashcardOpen, setFlashcardOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editNote) {
      setTitle(editNote.title)
      setContent(editNote.content)
      setEmoji(editNote.emoji)
      setNotebookId(editNote.notebookId)
      setTags(editNote.tags)
    } else {
      setTitle('')
      setContent('')
      setEmoji('📝')
      setNotebookId(defaultNotebookId || notebooks[0]?.id || '')
      setTags([])
    }
  }, [noteId])

  const linkedTitles = useMemo(() => extractLinkTitles(content), [content])
  const suggestions = useMemo(() => {
    if (!autoOpen) return []
    return notes
      .filter((n) => n.id !== noteId && n.title.toLowerCase().includes(autoQuery.toLowerCase()))
      .slice(0, 6)
  }, [autoOpen, autoQuery, notes, noteId])

  const insertSuggestion = (note: Note) => {
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const before = content.substring(0, pos)
    const lastOpen = before.lastIndexOf('[[')
    if (lastOpen === -1) return
    const newContent = content.substring(0, lastOpen) + `[[${note.title}]]` + content.substring(pos)
    setContent(newContent)
    setAutoOpen(false)
    const newPos = lastOpen + note.title.length + 4
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    const before = e.target.value.substring(0, e.target.selectionStart)
    const q = detectAutocompleteQuery(before)
    if (q !== null) {
      setAutoQuery(q)
      setAutoOpen(true)
      setAutoIndex(0)
    } else setAutoOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!autoOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAutoIndex((p) => (p + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAutoIndex((p) => (p - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (suggestions[autoIndex]) insertSuggestion(suggestions[autoIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setAutoOpen(false)
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

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="flex gap-2">
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
            className="flex-1 bg-transparent border-none outline-none text-2xl font-extrabold placeholder:text-muted-foreground/50"
            autoFocus
          />
        </div>

        <div className="relative">
          {autoOpen && suggestions.length > 0 && (
            <div className="absolute z-50 bottom-full left-0 right-0 mb-2 bg-popover border rounded-2xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {suggestions.map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    insertSuggestion(n)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    i === autoIndex ? 'bg-primary/15 text-primary' : 'hover:bg-muted',
                  )}
                >
                  <span>{n.emoji}</span>
                  <span className="font-semibold">{n.title}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Escreva sua nota... Use [[ para vincular a outras notas."
            className="w-full min-h-[200px] bg-muted/30 rounded-2xl p-4 border-none outline-none resize-y font-medium text-sm leading-relaxed"
          />
        </div>

        {linkedTitles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">Notas Vinculadas</h4>
            <div className="flex flex-wrap gap-2">
              {linkedTitles.map((t, i) => {
                const exists = notes.some((n) => n.title === t)
                return (
                  <button
                    key={i}
                    onClick={() => handleLinkClick(t)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold transition-all',
                      exists
                        ? 'bg-[#1CB0F6]/15 text-[#1CB0F6] hover:bg-[#1CB0F6]/25'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-3xl p-6 border space-y-4">
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

        <div className="bg-card rounded-3xl p-6 border">
          {editNote ? (
            <BacklinksSection noteId={editNote.id} onNavigate={onNavigateToNote} />
          ) : (
            <p className="text-sm text-muted-foreground font-semibold">
              Salve a nota para ver as referências (backlinks).
            </p>
          )}
        </div>
      </div>

      <FlashcardDialog
        open={flashcardOpen}
        onOpenChange={setFlashcardOpen}
        noteId={editNote?.id ?? null}
      />
    </div>
  )
}
