// Minimal markdown-ish renderer: fenced code blocks, inline code, bold, and
// paragraph breaks. Intentionally not a full markdown parser — just enough
// for chat responses to look right without pulling in a heavy dependency.
export function renderLite(text) {
  if (!text) return null
  const codeFence = /```(\w*)\n?([\s\S]*?)```/g
  const nodes = []
  let lastIndex = 0
  let match
  let key = 0

  while ((match = codeFence.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(renderParagraphs(text.slice(lastIndex, match.index), key++))
    }
    nodes.push(
      <pre key={`code-${key++}`}>
        <code>{match[2].replace(/\n$/, '')}</code>
      </pre>
    )
    lastIndex = codeFence.lastIndex
  }
  if (lastIndex < text.length) {
    nodes.push(renderParagraphs(text.slice(lastIndex), key++))
  }
  return nodes
}

function renderParagraphs(text, keyPrefix) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.length > 0)
  return paragraphs.map((para, i) => (
    <p key={`p-${keyPrefix}-${i}`}>{renderInline(para)}</p>
  ))
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>
    }
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ))
  })
}
