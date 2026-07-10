export function extractLinkTitles(content: string): string[] {
  const titles: string[] = []
  let match
  const regex = /\[\[([^\]]+)\]\]/g
  while ((match = regex.exec(content)) !== null) {
    titles.push(match[1].trim())
  }
  const htmlRegex = /data-note-title="([^"]+)"/g
  while ((match = htmlRegex.exec(content)) !== null) {
    titles.push(match[1].trim())
  }
  return titles
}

export function parseContentWithLinks(
  content: string,
): Array<{ type: 'text' | 'link'; value: string }> {
  const regex = /\[\[([^\]]+)\]\]/g
  const segments: Array<{ type: 'text' | 'link'; value: string }> = []
  let lastIndex = 0
  let match
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.substring(lastIndex, match.index) })
    }
    segments.push({ type: 'link', value: match[1].trim() })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.substring(lastIndex) })
  }
  return segments
}

export function detectAutocompleteQuery(textBeforeCursor: string): string | null {
  const lastOpen = textBeforeCursor.lastIndexOf('[[')
  const lastClose = textBeforeCursor.lastIndexOf(']]')
  if (lastOpen > lastClose && lastOpen !== -1) {
    return textBeforeCursor.substring(lastOpen + 2)
  }
  return null
}
