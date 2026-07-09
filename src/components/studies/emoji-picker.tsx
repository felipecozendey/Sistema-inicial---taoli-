import { cn } from '@/lib/utils'

const EMOJI_PRESETS = [
  '📝',
  '🧠',
  '🌱',
  '📚',
  '⚛️',
  '🎯',
  '💡',
  '🔥',
  '⭐',
  '🚀',
  '📖',
  '✨',
  '🎓',
  '🧩',
  '📊',
  '🌍',
  '🍅',
  '🔄',
  '💼',
  '🎨',
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {EMOJI_PRESETS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all',
            value === emoji
              ? 'bg-primary/20 ring-2 ring-primary scale-110'
              : 'bg-muted/50 hover:bg-muted',
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
