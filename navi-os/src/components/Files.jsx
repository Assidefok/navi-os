import { useState, useEffect, useRef } from 'react'
import {
  FolderOpen, File, FileCode, FileText, ChevronRight, ChevronDown,
  Search, X, Save
} from 'lucide-react'
import './Files.css'

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'sh', 'json', 'md', 'yml', 'yaml']
  if (codeExts.includes(ext)) return FileCode
  return FileText
}

function buildTree(files) {
  const root = { name: '', children: {}, dirs: [], files: [] }
  files.forEach(f => {
    const parts = f.path.split('/')
    let node = root
    parts.slice(0, -1).forEach(p => {
      if (!node.children[p]) {
        node.children[p] = { name: p, children: {}, dirs: [], files: [] }
        node.dirs.push(p)
      }
      node = node.children[p]
    })
    node.files.push({ name: parts[parts.length - 1], path: f.path, size: f.size, modified: f.modified })
  })
  return root
}

function TreeNode({ node, path, expanded, onToggle, selectedPath, onSelect }) {
  const dirs = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name))
  const files = [...node.files].sort((a, b) => a.name.localeCompare(b.name))
  const currentPath = path || ''

  return (
    <div className="tree-node">
      {dirs.map(dir => {
        const dirPath = currentPath ? `${currentPath}/${dir.name}` : dir.name
        const isExpanded = expanded[dirPath]
        return (
          <div key={dir.name}>
            <div
              className="tree-item dir"
              onClick={() => onToggle(dirPath)}
              data-active={selectedPath === dirPath}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <FolderOpen size={15} />
              <span>{dir.name}</span>
            </div>
            {isExpanded && (
              <div className="tree-children">
                <TreeNode
                  node={node.children[dir.name]}
                  path={dirPath}
                  expanded={expanded}
                  onToggle={onToggle}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                />
              </div>
            )}
          </div>
        )
      })}
      {files.map(f => (
        <div
          key={f.name}
          className="tree-item file"
          onClick={() => onSelect(f.path)}
          data-active={selectedPath === f.path}
        >
          <ChevronRight size={14} style={{ visibility: 'hidden' }} />
          {(() => { const Icon = getFileIcon(f.name); return <Icon size={15} /> })()}
          <span>{f.name}</span>
        </div>
      ))}
    </div>
  )
}

function Editor({ path, content, onChange, onSave }) {
  const textareaRef = useRef(null)
  const localContent = content || ''
  const lineCount = localContent.split('\n').length

  const handleChange = (e) => {
    const val = e.target.value
    onChange(val)
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      onSave()
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newVal = localContent.substring(0, start) + '  ' + localContent.substring(end)
      onChange(newVal)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2
          textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    }
  }

  return (
    <div className="code-editor">
      <div className="editor-header">
        <span className="editor-filename">{path?.split('/').pop() || 'untitled'}</span>
        <button className="editor-save-btn" onClick={onSave}>
          <Save size={14} /> Desar
        </button>
      </div>
      <div className="editor-body">
        <div className="line-numbers">
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={localContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />
      </div>
    </div>
  )
}

export default function Files() {
  const [files, setFiles] = useState([])
  const [expanded, setExpanded] = useState({})
  const [selectedPath, setSelectedPath] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadFiles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workspace-files')
      const data = await res.json()
      setFiles(data.files || [])
    } catch {
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const openFile = async (path) => {
    setSelectedPath(path)
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      setFileContent(data.content || '')
    } catch {
      setFileContent('// No s\'ha pogut llegir el fitxer')
    }
  }

  const saveFile = async () => {
    if (!selectedPath) return
    try {
      await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath, content: fileContent })
      })
    } catch {
      alert('No s\'ha pogut desar el fitxer')
    }
  }

  const filteredFiles = files.filter(f =>
    f.path.toLowerCase().includes(search.toLowerCase())
  )
  const tree = buildTree(filteredFiles)

  const toggleDir = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }

  return (
    <div className="files-view">
      <div className="files-toolbar">
        <button className="files-action-btn" onClick={loadFiles} title="Actualitzar">
          ↻
        </button>
        <div className="files-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Buscar fitxers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
      </div>

      <div className="files-layout">
        <aside className="files-sidebar">
          {loading ? (
            <div className="files-loading">Carregant...</div>
          ) : files.length === 0 ? (
            <div className="files-empty">Cap fitxer trobat</div>
          ) : (
            <div className="tree-root">
              <TreeNode
                node={tree}
                expanded={expanded}
                onToggle={toggleDir}
                selectedPath={selectedPath}
                onSelect={openFile}
              />
            </div>
          )}
        </aside>

        <main className="files-editor-area">
          {selectedPath ? (
            <Editor
              path={selectedPath}
              content={fileContent}
              onChange={setFileContent}
              onSave={saveFile}
            />
          ) : (
            <div className="editor-empty">
              <File size={32} style={{ opacity: 0.3 }} />
              <p>Selecciona un fitxer per editar</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
