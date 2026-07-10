import { useRef, useEffect, useState, useCallback } from 'react'
import { detectAutocompleteQuery } from '@/lib/link-parser'
import { uploadImage } from '@/lib/image-upload'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Pilcrow,
  Palette,
  Highlighter,
  Plus,
  List,
  ListOrdered,
  Brackets,
  X,
  ArrowRight,
} from 'lucide-react'
import './rich-text-editor.css'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  onLinkClick?: (noteTitle: string) => void
  onCreateNote?: (title: string) => string
  notes?: Array<{ id: string; title: string; emoji: string }>
  currentNoteId?: string | null
  placeholder?: string
  variant?: 'full' | 'mini'
  enableCloze?: boolean
}

const TEXT_COLORS = ['#1a1a1a', '#FF4B4B', '#1CB0F6', '#58CC02', '#FF9600', '#CE82FF']
const HIGHLIGHT_COLORS = ['#FFF700', '#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', 'transparent']
const LINK_BG = [
  'rgba(28,176,246,0.15)',
  'rgba(255,75,75,0.15)',
  'rgba(88,204,2,0.15)',
  'rgba(255,150,0,0.15)',
  'rgba(206,130,255,0.15)',
  'rgba(255,200,0,0.15)',
]
const LINK_FG = ['#1CB0F6', '#FF4B4B', '#58CC02', '#FF9600', '#CE82FF', '#1a1a1a']
const LINK_STYLE =
  'display:inline-block;padding:2px 12px;border-radius:1.5rem;background-color:rgba(28,176,246,0.15);color:#1CB0F6;font-weight:700;font-size:0.875rem;cursor:pointer;margin:0 2px;border:2px solid rgba(28,176,246,0.3);transition:all 0.2s ease;text-decoration:none;'

function convertToHtml(content: string, notes: Array<{ id: string; title: string }>): string {
  if (/<[a-z][\s\S]*>/i.test(content)) return content
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
      const note = notes.find((n) => n.title === title)
      const noteId = note?.id || ''
      return `<span class="note-link" contenteditable="false" data-note-title="${title}"${noteId ? ` data-note-id="${noteId}"` : ''} style="${LINK_STYLE}">${title}</span>`
    })
}

export function RichTextEditor({
  content,
  onChange,
  onLinkClick,
  onCreateNote,
  notes = [],
  currentNoteId,
  placeholder,
  variant = 'full',
  enableCloze = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [noteLinkEl, setNoteLinkEl] = useState<HTMLElement | null>(null)
  const [uploading, setUploading] = useState(false)

  const suggestions = notes
    .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)
  const exactMatch = notes.some((n) => n.title.toLowerCase() === query.toLowerCase().trim())
  const showCreateOption = query.trim().length > 0 && !exactMatch
  const totalOptions = (showCreateOption ? 1 : 0) + suggestions.length

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.innerHTML = convertToHtml(content, notes)
  }, [currentNoteId])

  const getTextBeforeCursor = (): string => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return ''
    const range = sel.getRangeAt(0)
    const preRange = range.cloneRange()
    preRange.selectNodeContents(editorRef.current!)
    preRange.setEnd(range.endContainer, range.endOffset)
    return preRange.toString()
  }

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || '')
    if (variant !== 'full') return
    const q = detectAutocompleteQuery(getTextBeforeCursor())
    if (q !== null) {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange()
      setQuery(q)
      setShowAutocomplete(true)
      setSelectedIndex(0)
    } else setShowAutocomplete(false)
  }

  const insertNoteLink = (note: { id: string; title: string; emoji: string }) => {
    const sel = window.getSelection()
    if (!sel || !savedRangeRef.current) return
    const range = savedRangeRef.current.cloneRange()
    range.setStart(range.startContainer, Math.max(0, range.startOffset - query.length - 2))
    range.deleteContents()
    const span = document.createElement('span')
    span.className = 'note-link'
    span.setAttribute('contenteditable', 'false')
    span.setAttribute('data-note-title', note.title)
    span.setAttribute('data-note-id', note.id)
    span.style.cssText = LINK_STYLE
    span.textContent = note.title
    range.insertNode(span)
    const space = document.createTextNode('\u00A0')
    span.after(space)
    const newRange = document.createRange()
    newRange.setStartAfter(space)
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)
    setShowAutocomplete(false)
    onChange(editorRef.current?.innerHTML || '')
  }

  const handleCreateNote = () => {
    if (!onCreateNote) return
    const id = onCreateNote(query.trim())
    insertNoteLink({ id, title: query.trim(), emoji: '📝' })
  }

  const selectOption = (index: number) => {
    if (showCreateOption && index === 0) handleCreateNote()
    else {
      const noteIdx = showCreateOption ? index - 1 : index
      if (suggestions[noteIdx]) insertNoteLink(suggestions[noteIdx])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete || totalOptions === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((p) => (p + 1) % totalOptions)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((p) => (p - 1 + totalOptions) % totalOptions)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      selectOption(selectedIndex)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowAutocomplete(false)
    }
  }

  const exec = (cmd: string, val?: string) => {
    document.execCommand('styleWithCSS', false, 'true')
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }

  const handleCloze = () => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    const span = document.createElement('span')
    span.className = 'cloze-deletion'
    span.setAttribute('data-hidden', 'true')
    try {
      range.surroundContents(span)
    } catch {
      const c = range.extractContents()
      span.appendChild(c)
      range.insertNode(span)
    }
    sel.removeAllRanges()
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }

  const handleImageInsert = useCallback(
    async (file: File) => {
      setUploading(true)
      const url = await uploadImage(file)
      setUploading(false)
      const img = `<img src="${url}" alt="" style="max-width:100%;border-radius:1rem;margin:0.5rem 0;" />`
      document.execCommand('insertHTML', false, img)
      editorRef.current?.focus()
      onChange(editorRef.current?.innerHTML || '')
    },
    [onChange],
  )

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) handleImageInsert(file)
        return
      }
    }
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const handleDrop = (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    e.preventDefault()
    files.forEach(handleImageInsert)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault()
  }

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const linkEl = target.closest('.note-link') as HTMLElement | null
    if (linkEl) {
      if (variant === 'full') {
        e.stopPropagation()
        setNoteLinkEl(linkEl)
      } else if (onLinkClick) {
        const t = linkEl.getAttribute('data-note-title')
        if (t) onLinkClick(t)
      }
    } else {
      setNoteLinkEl(null)
    }
  }

  const updateLinkColor = (bg: string, fg: string) => {
    if (!noteLinkEl) return
    noteLinkEl.style.backgroundColor = bg
    noteLinkEl.style.color = fg
    noteLinkEl.style.borderColor = bg.replace(/[\d.]+\)$/, '0.4)')
    noteLinkEl.setAttribute('data-link-color', fg)
    onChange(editorRef.current?.innerHTML || '')
  }

  const navigateToNote = () => {
    if (!noteLinkEl || !onLinkClick) return
    const noteId = noteLinkEl.getAttribute('data-note-id')
    const title = noteLinkEl.getAttribute('data-note-title')
    setNoteLinkEl(null)
    if (noteId && onLinkClick) {
      onLinkClick(title || noteId)
    } else if (title) {
      onLinkClick(title)
    }
  }

  const btn = 'p-2 rounded-xl hover:bg-muted transition-colors'
  const isFull = variant === 'full'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap p-2 bg-muted/30 rounded-2xl">
        {isFull && noteLinkEl && (
          <div className="flex items-center gap-1.5 w-full pb-2 mb-1 border-b-2 border-border animate-fade-in">
            <span className="text-xs font-bold text-muted-foreground mr-1">Cor do link:</span>
            {LINK_BG.map((bg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => updateLinkColor(bg, LINK_FG[i])}
                className="w-6 h-6 rounded-full border-2 border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: bg }}
              />
            ))}
            <button
              type="button"
              onClick={navigateToNote}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold border-2 border-b-4 border-primary/80 active:translate-y-0.5 active:border-b-2 transition-all ml-auto"
            >
              Abrir nota <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setNoteLinkEl(null)}
              className="p-1 rounded-lg hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <button type="button" onClick={() => exec('bold')} className={btn}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('italic')} className={btn}>
          <Italic className="w-4 h-4" />
        </button>
        {isFull && (
          <button type="button" onClick={() => exec('underline')} className={btn}>
            <Underline className="w-4 h-4" />
          </button>
        )}
        <div className="w-px h-6 bg-border mx-1" />
        <button type="button" onClick={() => exec('formatBlock', 'h1')} className={btn}>
          <Heading1 className="w-4 h-4" />
        </button>
        {isFull && (
          <button type="button" onClick={() => exec('formatBlock', 'h2')} className={btn}>
            <Heading2 className="w-4 h-4" />
          </button>
        )}
        <button type="button" onClick={() => exec('formatBlock', 'p')} className={btn}>
          <Pilcrow className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className={btn}>
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={btn}>
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={btn}>
              <Palette className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto rounded-2xl">
            <div className="flex gap-2">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => exec('foreColor', c)}
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {isFull && (
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={btn}>
                <Highlighter className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-2xl">
              <div className="flex gap-2">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => exec('hiliteColor', c)}
                    className="w-6 h-6 rounded-full border-2 border-border"
                    style={{
                      backgroundColor: c === 'transparent' ? 'white' : c,
                      opacity: c === 'transparent' ? 0.3 : 1,
                    }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        {enableCloze && (
          <button
            type="button"
            onClick={handleCloze}
            className={btn}
            title="Omissão de palavras (Cloze)"
          >
            <Brackets className="w-4 h-4" />
          </button>
        )}
        {uploading && (
          <span className="text-xs text-muted-foreground font-bold animate-pulse">Enviando...</span>
        )}
      </div>
      <div className="relative">
        {showAutocomplete && totalOptions > 0 && (
          <div className="absolute z-50 bottom-full left-0 right-0 mb-2 bg-popover border-2 rounded-3xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {showCreateOption && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleCreateNote()
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors border-b-2 border-border',
                  selectedIndex === 0 ? 'bg-primary/15 text-primary' : 'hover:bg-muted',
                )}
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold">Criar nova nota:</span>
                <span className="font-semibold text-primary truncate">
                  &ldquo;{query.trim()}&rdquo;
                </span>
              </button>
            )}
            {suggestions.map((n, i) => {
              const idx = showCreateOption ? i + 1 : i
              return (
                <button
                  key={n.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    insertNoteLink(n)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                    idx === selectedIndex ? 'bg-primary/15 text-primary' : 'hover:bg-muted',
                  )}
                >
                  <span>{n.emoji}</span>
                  <span className="font-semibold">{n.title}</span>
                </button>
              )
            })}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          data-placeholder={placeholder}
          className={cn(
            'rte-editor w-full bg-muted/30 rounded-2xl p-4 outline-none resize-y font-medium text-sm leading-relaxed prose prose-sm max-w-none focus:outline-none',
            isFull ? 'min-h-[200px]' : 'min-h-[80px]',
          )}
        />
      </div>
    </div>
  )
}
