import { useRef, useEffect, useState } from 'react'
import { detectAutocompleteQuery } from '@/lib/link-parser'
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
} from 'lucide-react'
import './rich-text-editor.css'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  onLinkClick: (noteTitle: string) => void
  onCreateNote: (title: string) => string
  notes: Array<{ id: string; title: string; emoji: string }>
  currentNoteId: string | null
  placeholder?: string
}

const TEXT_COLORS = ['#1a1a1a', '#FF4B4B', '#1CB0F6', '#58CC02', '#FF9600', '#CE82FF']
const HIGHLIGHT_COLORS = ['#FFF700', '#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', 'transparent']
const LINK_STYLE =
  'display:inline-block;padding:2px 12px;border-radius:1.5rem;background-color:rgba(28,176,246,0.15);color:#1CB0F6;font-weight:700;font-size:0.875rem;cursor:pointer;margin:0 2px;border:2px solid rgba(28,176,246,0.2);transition:all 0.15s ease;'

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
  notes,
  currentNoteId,
  placeholder,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

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
    const startOffset = Math.max(0, range.startOffset - query.length - 2)
    range.setStart(range.startContainer, startOffset)
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
    const id = onCreateNote(query.trim())
    insertNoteLink({ id, title: query.trim(), emoji: '📝' })
  }

  const selectOption = (index: number) => {
    if (showCreateOption && index === 0) {
      handleCreateNote()
    } else {
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

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('note-link')) {
      const title = target.getAttribute('data-note-title')
      if (title) onLinkClick(title)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const btn = 'p-2 rounded-xl hover:bg-muted transition-colors'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap p-2 bg-muted/30 rounded-2xl">
        <button type="button" onClick={() => exec('bold')} className={btn}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('italic')} className={btn}>
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('underline')} className={btn}>
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" />
        <button type="button" onClick={() => exec('formatBlock', 'h1')} className={btn}>
          <Heading1 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('formatBlock', 'h2')} className={btn}>
          <Heading2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('formatBlock', 'p')} className={btn}>
          <Pilcrow className="w-4 h-4" />
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
          data-placeholder={placeholder}
          className="rte-editor w-full min-h-[200px] bg-muted/30 rounded-2xl p-4 outline-none resize-y font-medium text-sm leading-relaxed prose prose-sm max-w-none focus:outline-none"
        />
      </div>
    </div>
  )
}
