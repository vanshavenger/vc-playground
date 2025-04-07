import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [data, setData] = useState<any>()
  const [input, setInput] = useState<string>('')
  const [show, setShow] = useState(false)
  const [cache, setCache] = useState<any>({})

  const fetchData = async () => {
    if (cache[input]) {
      setData(cache[input])
      return
    }
    const res = await fetch(`https://dummyjson.com/recipes/search?q=${input}`)
    const data = await res.json()

    setCache((prev: any) => ({
      ...prev,
      [input]: data.recipes,
    }))

    console.log('fetching data')
    setData(data.recipes)
  }

  useEffect(() => {
    const timeoutId = setTimeout(fetchData, 300)

    return () => clearTimeout(timeoutId)
  }, [input])

  return (
    <div className='App'>
      <h1>Autocomplete-search-bar</h1>
      <div>
        <input
          type='text'
          className='search-input'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setShow(true)}
          onBlur={() => setShow(false)}
        />

        {show && (
          <div className='result-container'>
            {data &&
              data.map((r: any) => (
                <span className='result' key={r.id}>
                  {r.name}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
