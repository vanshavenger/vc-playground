'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { WS_BACKEND_BASE_URL } from '@/lib/utils'

interface DrawingData {
  type: 'draw'
  userID: string
  drawingData: {
    x: number
    y: number
    color: string
    isNewLine: boolean
  }
}

export default function Room() {
  const { id } = useParams()
  const router = useRouter()

  const [isConnected, setIsConnected] = useState(false)
  const [drawingData, setDrawingData] = useState<DrawingData[]>([])
  const [currentColor, setCurrentColor] = useState('#000000')
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/signin')
      return
    }

    const ws = new WebSocket(WS_BACKEND_BASE_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connection established')
      ws.send(JSON.stringify({ type: 'auth', token }))
    }

    ws.onmessage = event => {
      const data = JSON.parse(event.data)
      switch (data.type) {
        case 'auth':
          if (data.success) {
            setIsConnected(true)
            ws.send(JSON.stringify({ type: 'join_room', roomId: id }))
          } else {
            setError('Authentication failed')
            router.push('/signin')
          }
          break
        case 'room_joined':
          setDrawingData(data.drawingData || [])
          break
        case 'draw':
          setDrawingData(prevData => [...prevData, data])
          drawOnCanvas(data.drawingData)
          break
        case 'error':
          setError(data.message)
          break
      }
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
      setIsConnected(false)
      setError('Connection lost. Please try rejoining the room.')
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [id, router])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawingData.forEach(data => {
      if (data.type === 'draw') {
        drawOnCanvas(data.drawingData)
      }
    })
  }, [drawingData])

  const drawOnCanvas = (data: DrawingData['drawingData']) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = data.color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (data.isNewLine) {
      ctx.beginPath()
      ctx.moveTo(data.x, data.y)
    } else {
      ctx.lineTo(data.x, data.y)
      ctx.stroke()
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true
    const { offsetX, offsetY } = e.nativeEvent
    lastPoint.current = { x: offsetX, y: offsetY }
    draw(offsetX, offsetY, true)
  }

  const stopDrawing = () => {
    isDrawing.current = false
    lastPoint.current = null
  }

  const draw = (x: number, y: number, isNewLine: boolean) => {
    if (!isDrawing.current) return

    const drawData: DrawingData = {
      type: 'draw',
      userID: 'currentUser', // This should be replaced with the actual user ID
      drawingData: {
        x,
        y,
        color: currentColor,
        isNewLine,
      },
    }

    wsRef.current?.send(JSON.stringify(drawData))
    drawOnCanvas(drawData.drawingData)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return

    const { offsetX, offsetY } = e.nativeEvent
    draw(offsetX, offsetY, false)
    lastPoint.current = { x: offsetX, y: offsetY }
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='bg-white p-8 rounded-lg shadow-md'>
          <h1 className='text-2xl font-bold mb-4 text-red-500'>Error</h1>
          <p>{error}</p>
          <button
            onClick={() => router.push('/rooms')}
            className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
          >
            Back to Rooms
          </button>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='bg-white p-8 rounded-lg shadow-md'>
          <h1 className='text-2xl font-bold mb-4'>Connecting to room...</h1>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100 p-8'>
      <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6'>
        <h1 className='text-2xl font-bold mb-6'>Room: {id}</h1>
        <div className='mb-4 flex items-center'>
          <label htmlFor='color-picker' className='mr-2'>
            Choose color:
          </label>
          <input
            type='color'
            id='color-picker'
            value={currentColor}
            onChange={e => setCurrentColor(e.target.value)}
            className='w-8 h-8 border-none'
          />
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className='border border-gray-300 cursor-crosshair'
        />
        <button
          onClick={() => router.push('/rooms')}
          className='mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
        >
          Back to Rooms
        </button>
      </div>
    </div>
  )
}
