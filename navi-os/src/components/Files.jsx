import { useState, useEffect, useRef, useCallback } from 'react'
import {
  FolderOpen, File, FileCode, FileText, ChevronRight, ChevronDown,
  Search, X, Save, Download, Upload, Image, Eye
} from 'lucide-react'
import './Files.css'

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'css', 'html', 'py', 'sh', 'json', 'md', 'yml', 'yaml']
  if (codeExts.includes(ext)) return FileCode
  return FileText
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
function isImageFile(name) {
  const ext = name.split('.').pop().toLowerCase()
  return IMAGE_EXTS.includes(ext)
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

// ─── Toast Notification ────────────────────────────────────────────────────────
function Toast({ id, message, type, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 2800)
    return () => clearTimeout(t)
  }, [id, onRemove])
  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' && <span>✓</span>}
      {type === 'info' && <span>↩</span>}
      {type === 'error' && <span>✗</span>}
      <span>{message}</span>
    </div>
  )
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} id={t.id} message={t.message} type={t.type} onRemove={onRemove} />
      ))}
    </div>
  )
}

// ─── Editor ───────────────────────────────────────────────────────────────────
function Editor({ path, content, onChange, onSave, onCancel, onDownload, onUpload, notif, currentDir }) {
  const textareaRef = useRef(null)
  const localContent = content || ''
  const lineCount = localContent.split('\n').length
  const fileName = path?.split('/').pop() || 'untitled'
  const isImage = isImageFile(fileName)
  const imageUrl = path ? `/api/file-binary?path=${encodeURIComponent(path)}` : null

  const handleChange = (e) => onChange(e.target.value)

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

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of [...items]) {
      if (item.kind === 'file') {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) onUpload(file, currentDir)
        return
      }
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file, currentDir)
    e.target.value = ''
  }

  return (
    <div className="code-editor">
      <div className="editor-header">
        <span className="editor-filename">{fileName}</span>
        <div className="editor-actions">
          {notif && (
            <span className={`editor-notif editor-notif-${notif.type}`}>{notif.message}</span>
          )}
          <label className="editor-btn editor-upload-btn" title="Pujar fitxer">
            <Upload size={13} /> Penjar
            <input type="file" style={{ display: 'none' }} onChange={handleFileInput} />
          </label>
          <button className="editor-btn editor-download-btn" onClick={onDownload} title="Descarregar">
            <Download size={13} /> Descarregar
          </button>
          <button className="editor-btn editor-cancel-btn" onClick={onCancel} title="Cancel·lar canvis">
            <X size={13} /> Cancelar
          </button>
          <button className="editor-btn editor-save-btn" onClick={onSave} title="Desar (Ctrl+S)">
            <Save size={13} /> Desar
          </button>
        </div>
      </div>
      <div className="editor-body" onPaste={handlePaste}>
        {isImage && imageUrl ? (
          <div className="editor-image-preview">
            <Eye size={20} className="image-icon-label" />
            <img src={imageUrl} alt={fileName} className="image-preview-img" />
          </div>
        ) : (
          <>
            <div className="line-numbers">
              {Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}
            </div>
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={localContent}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Files() {
  const [files, setFiles] = useState([])
  const [expanded, setExpanded] = useState({})
  const [selectedPath, setSelectedPath] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toasts, setToasts] = useState([])
  const [notif, setNotif] = useState(null)
  const toastId = useRef(0)

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showNotif = useCallback((message, type = 'success') => {
    setNotif({ message, type })
    setTimeout(() => setNotif(null), 2200)
  }, [])

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

  useEffect(() => { loadFiles() }, [])

  const openFile = async (path) => {
    setSelectedPath(path)
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      const c = data.content || ''
      setFileContent(c)
      setSavedContent(c)
    } catch {
      setFileContent('// No s\'ha pogut llegir el fitxer')
      setSavedContent('')
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
      setSavedContent(fileContent)
      showNotif('Canvis desats', 'success')
      addToast('Canvis desats', 'success')
    } catch {
      showNotif('Error en desar', 'error')
      addToast('Error en desar', 'error')
    }
  }

  const cancelChanges = () => {
    if (fileContent !== savedContent) {
      setFileContent(savedContent)
      showNotif('Canvis cancel·lats', 'info')
      addToast('Canvis cancel·lats', 'info')
    }
  }

  const downloadFile = () => {
    if (!selectedPath) return
    const a = document.createElement('a')
    a.href = `/api/download?path=${encodeURIComponent(selectedPath)}`
    a.download = selectedPath.split('/').pop()
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showNotif('Descarrega iniciada', 'success')
    addToast('Descarrega iniciada', 'success')
  }

  const uploadFile = async (fileObj, dirPath) => {
    if (!dirPath) { addToast('Selecciona un directori', 'error'); return }
    try {
      const buf = await fileObj.arrayBuffer()
      const base64 = btoa(new Uint8Array(buf).reduce((d, b) => d + String.fromCharCode(b), ''))
      await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: dirPath, name: fileObj.name, content: base64 })
      })
      showNotif(`"${fileObj.name}" penjat`, 'success')
      addToast(`"${fileObj.name}" penjat`, 'success')
      await loadFiles()
    } catch {
      addToast('Error en penjar', 'error')
    }
  }

  const currentDir = selectedPath ? selectedPath.split('/').slice(0, -1).join('/') : ''
  const filteredFiles = files.filter(f => f.path.toLowerCase().includes(search.toLowerCase()))
  const tree = buildTree(filteredFiles)

  const toggleDir = (path) => setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  return (
    <div className="files-view">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
              onCancel={cancelChanges}
              onDownload={downloadFile}
              onUpload={uploadFile}
              notif={notif}
              currentDir={currentDir}
            />
          ) : (
            <div className="editor-empty">
              <File size={32} style={{ opacity: 0.3 }} />
              <p>Selecciona un fitxer per editar</p>
              <p className="editor-hint">Enganxa o penja fitxers per pujar al directori</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
