import { useState } from 'react';
import './App.css'
import jsonData from './data.json'
import { FileSystem } from './types';
import { FolderPlus, FilePlus,  Trash2Icon } from 'lucide-react';

const FileItem = ({ item, onAddNode, onDeleteNode }: { item: FileSystem, onAddNode: (parentId: number, isFolder: boolean) => void, onDeleteNode: (id: number) => void }) => {
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
        <span onClick={() => onDeleteNode(item.id)} className='add-icon clickable'>
              <Trash2Icon  size={16}/>
            </span>
      </div>
      {item.isFolder && item.children && !isCollapsed && (
        <div className="children">
          <List onAddNode={onAddNode} data={item.children} onDeleteNode={onDeleteNode} />
        </div>
      )}
    </div>
  )
}

const List = ({ data, onAddNode, onDeleteNode }: {
  data: FileSystem[], onAddNode:  (parentId: number, isFolder: boolean) => void, onDeleteNode: (id: number) => void
 }) => {
  return (
    <div className="container">
      {data.map((item: FileSystem) => (
        <FileItem key={item.id} item={item} onAddNode={onAddNode} onDeleteNode={onDeleteNode} />
      ))}
    </div>
  )
}


function App() {
  const [data, setData] = useState<FileSystem[]>(jsonData)

  const onDelete = (id: number) => {
    const onDeleteNode = (items: FileSystem[]): FileSystem[] => {


      const filteredItems = items.filter(item => item.id !== id)

      console.log(filteredItems)

      return filteredItems.map((item) => {
        if (item.children && item.children.length > 0) {
          return {
            ...item,
            children: onDeleteNode(item.children),
          }
        }
        return item
      })
    }

    setData(onDeleteNode(data))
  }

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
      <List data={data} onAddNode={onNode} onDeleteNode={onDelete} />
    </>
  )
}

export default App
