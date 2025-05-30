import { useEffect, useState, type KeyboardEvent, useRef } from 'react'
import './App.css'

interface Recipe {
  id: number
  name: string
}

interface RecipeResponse {
  recipes: Recipe[]
}

function App() {
  const [data, setData] = useState<Recipe[]>([])
  const [input, setInput] = useState<string>('')
  const [show, setShow] = useState(false)
  const [cache, setCache] = useState<Record<string, Recipe[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const resultContainerRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    if (!input.trim()) {
      setData([])
      return
    }

    if (cache[input]) {
      setData(cache[input])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(
        `https://dummyjson.com/recipes/search?q=${encodeURIComponent(input)}`,
      )
      if (!res.ok) throw new Error('Failed to fetch recipes')

      const data: RecipeResponse = await res.json()

      setCache((prev) => ({
        ...prev,
        [input]: data.recipes,
      }))

      setData(data.recipes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(fetchData, 300)
    return () => clearTimeout(timeoutId)
  }, [input])

  useEffect(() => {
    setSelectedIndex(-1)
  }, [data])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!show || isLoading || data.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prevIndex) =>
        prevIndex < data.length - 1 ? prevIndex + 1 : prevIndex,
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      setInput(data[selectedIndex].name)
      setShow(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShow(false)
    }
  }

  useEffect(() => {
    if (selectedIndex >= 0 && resultContainerRef.current) {
      const selectedElement = resultContainerRef.current.children[
        selectedIndex
      ] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  return (
    <div className='App'>
      <h1>Recipe Search</h1>
      <div className='search-container'>
        <input
          id='recipe-search'
          type='text'
          className='search-input'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 100)}
          onKeyDown={handleKeyDown}
          placeholder='Type to search recipes...'
          aria-describedby='search-status'
        />

        {error && (
          <div className='error-message' role='alert'>
            {error}
          </div>
        )}

        {show && (
          <div
            id='search-results'
            ref={resultContainerRef}
            className='result-container'
            role='listbox'
            aria-label='Search results'
          >
            {isLoading ? (
              <div className='loading'>Loading...</div>
            ) : data.length > 0 ? (
              data.map((recipe, index) => (
                <span
                  className={`result ${
                    selectedIndex === index ? 'selected' : ''
                  }`}
                  key={recipe.id}
                  id={`recipe-${recipe.id}`}
                  role='option'
                  aria-selected={selectedIndex === index}
                  tabIndex={0}
                  onClick={() => {
                    setInput(recipe.name)
                    setShow(false)
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {recipe.name}
                </span>
              ))
            ) : (
              <div className='no-results'>No recipes found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
