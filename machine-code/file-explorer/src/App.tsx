import { useState } from 'react';
import './App.css'
import jsonData from './data.json'
import { FileSystem } from './types';
import { FolderPlus, FilePlus } from 'lucide-react';

const FileItem = ({ item, onAddNode }: { item: FileSystem, onAddNode: (parentId: number, isFolder: boolean) => void }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = (e: React.MouseEvent) => {
    if (item.isFolder) {
      e.stopPropagation()
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <div className={`item ${item.isFolder ? "folder" : "file"}`}>
      <div>
        {item.isFolder ? (
          <span className="folder-icon">{isCollapsed ? '📁' : '📂'}</span>
        ) : (
          <span className="file-icon">📄</span>
        )}
        <span className={`item-header ${item.isFolder ? "clickable" : ""}`} onClick={toggleCollapse}>{item.name}</span>
        
        {item.isFolder && (
          <>
            <span 
              onClick={() => onAddNode(item.id, true)} 
              className="add-icon clickable" 
              title="Add folder"
            >
              <FolderPlus size={16} />
            </span>
            <span 
              onClick={() => onAddNode(item.id, false)} 
              className="add-icon clickable" 
              title="Add file"
            >
              <FilePlus size={16} />
            </span>
          </>
        )}
      </div>
      {item.isFolder && item.children && !isCollapsed && (
        <div className="children">
          <List onAddNode={onAddNode} data={item.children} />
        </div>
      )}
    </div>
  )
}

const List = ({ data, onAddNode }: {
  data: FileSystem[], onAddNode:  (parentId: number, isFolder: boolean) => void
 }) => {
  return (
    <div className="container">
      {data.map((item: FileSystem) => (
        <FileItem key={item.id} item={item} onAddNode={onAddNode} />
      ))}
    </div>
  )
}


function App() {
  const [data, setData] = useState<FileSystem[]>(jsonData)

  const onNode = (parentId: number, isFolder: boolean) => {

    const namePrompted = prompt(`Enter ${isFolder ? 'folder' : 'file'} name`)

    if (!namePrompted) {
      alert("Name is required")
      return
    }

    const newNode: FileSystem = {
      id: Date.now(),
      name: namePrompted,
      isFolder: isFolder,
      children: []
    }

    const addNodeToTree = (items: FileSystem[]): FileSystem[] => {
      return items.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children || []), newNode]
          }
        }
        if (item.children) {
          return {
            ...item,
            children: addNodeToTree(item.children)
          }
        }
        return item
      })
    }

    setData(addNodeToTree(data))
  }

  return (
    <>
      <h1>
        File explorer sandbox
      </h1>
      <p>Welcome to the file explorer application!</p>
      <List data={data} onAddNode={onNode} />
    </>
  )
}

export default App
