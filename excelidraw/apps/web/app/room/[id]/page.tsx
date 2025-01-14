'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { WS_BACKEND_BASE_URL } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Pencil, Eraser, Square, Circle } from 'lucide-react'

interface DrawingData {
  type: 'draw' | 'add_shape' | 'erase'
  drawingData?: {
    x: number
    y: number
    color: string
    isNewLine: boolean
  }
  shapeData?: {
    type: 'rectangle' | 'circle'
    x: number
    y: number
    width: number
    height: number
    color: string
  }
  eraseData?: {
    x: number
    y: number
    radius: number
  }
}

export default function Room() {
  const { id } = useParams()
  const router = useRouter()

  const [isConnected, setIsConnected] = useState(false)
  const [drawingData, setDrawingData] = useState<DrawingData[]>([])
  const [currentColor, setCurrentColor] = useState('#000000')
  const [currentTool, setCurrentTool] = useState<
    'pen' | 'eraser' | 'rectangle' | 'circle'
  >('pen')
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
        case 'add_shape':
        case 'erase':
          setDrawingData(prevData => [...prevData, data])
          drawOnCanvas(data)
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

  const redrawCanvas = useCallback((data: DrawingData[]) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    data.forEach(item => drawOnCanvas(item))
  }, [])

  useEffect(() => {
    redrawCanvas(drawingData)
  }, [drawingData, redrawCanvas])

  const drawOnCanvas = (data: DrawingData) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    switch (data.type) {
      case 'draw':
        if (data.drawingData) {
          ctx.strokeStyle = data.drawingData.color
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          if (data.drawingData.isNewLine) {
            ctx.beginPath()
            ctx.moveTo(data.drawingData.x, data.drawingData.y)
          } else {
            ctx.lineTo(data.drawingData.x, data.drawingData.y)
            ctx.stroke()
          }
        }
        break
      case 'add_shape':
        if (data.shapeData) {
          ctx.fillStyle = data.shapeData.color
          if (data.shapeData.type === 'rectangle') {
            ctx.fillRect(
              data.shapeData.x,
              data.shapeData.y,
              data.shapeData.width,
              data.shapeData.height
            )
          } else if (data.shapeData.type === 'circle') {
            ctx.beginPath()
            ctx.arc(
              data.shapeData.x,
              data.shapeData.y,
              data.shapeData.width / 2,
              0,
              2 * Math.PI
            )
            ctx.fill()
          }
        }
        break
      case 'erase':
        if (data.eraseData) {
          ctx.globalCompositeOperation = 'destination-out'
          ctx.beginPath()
          ctx.arc(
            data.eraseData.x,
            data.eraseData.y,
            data.eraseData.radius,
            0,
            2 * Math.PI
          )
          ctx.fill()
          ctx.globalCompositeOperation = 'source-over'
        }
        break
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true
    const { offsetX, offsetY } = e.nativeEvent
    lastPoint.current = { x: offsetX, y: offsetY }
    if (currentTool === 'pen') {
      draw(offsetX, offsetY, true)
    } else if (currentTool === 'eraser') {
      erase(offsetX, offsetY)
    }
  }

  const stopDrawing = () => {
    isDrawing.current = false
    lastPoint.current = null
  }

  const draw = (x: number, y: number, isNewLine: boolean) => {
    if (!isDrawing.current) return

    const drawData: DrawingData = {
      type: 'draw',
      drawingData: {
        x,
        y,
        color: currentColor,
        isNewLine,
      },
    }

    wsRef.current?.send(JSON.stringify(drawData))
    drawOnCanvas(drawData)
  }

  const erase = (x: number, y: number) => {
    if (!isDrawing.current) return

    const eraseData: DrawingData = {
      type: 'erase',
      eraseData: {
        x,
        y,
        radius: 10,
      },
    }

    wsRef.current?.send(JSON.stringify(eraseData))
    drawOnCanvas(eraseData)
  }

  const addShape = (shapeType: 'rectangle' | 'circle') => {
    const canvas = canvasRef.current
    if (!canvas) return

    const shapeData: DrawingData = {
      type: 'add_shape',
      shapeData: {
        type: shapeType,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        width: 50,
        height: 50,
        color: currentColor,
      },
    }

    wsRef.current?.send(JSON.stringify(shapeData))
    drawOnCanvas(shapeData)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return

    const { offsetX, offsetY } = e.nativeEvent
    if (currentTool === 'pen') {
      draw(offsetX, offsetY, false)
    } else if (currentTool === 'eraser') {
      erase(offsetX, offsetY)
    }
    lastPoint.current = { x: offsetX, y: offsetY }
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-2xl font-bold text-red-500'>
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button
              onClick={() => router.push('/rooms')}
              className='mt-4 w-full'
            >
              Back to Rooms
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-2xl font-bold'>
              Connecting to room...
            </CardTitle>
          </CardHeader>
          <CardContent className='flex justify-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100 p-4 sm:p-8'>
      <Card className='max-w-4xl mx-auto'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>Room: {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-4 flex flex-wrap items-center gap-4'>
            <div className='flex items-center space-x-2'>
              <label htmlFor='color-picker' className='sr-only'>
                Color:
              </label>
              <Input
                type='color'
                id='color-picker'
                value={currentColor}
                onChange={e => setCurrentColor(e.target.value)}
                className='w-10 h-10 p-0 border-none'
              />
            </div>
            <div className='space-x-2'>
              <Button
                onClick={() => setCurrentTool('pen')}
                variant={currentTool === 'pen' ? 'default' : 'outline'}
                size='icon'
                aria-label='Pen tool'
              >
                <Pencil className='h-4 w-4' />
              </Button>
              <Button
                onClick={() => setCurrentTool('eraser')}
                variant={currentTool === 'eraser' ? 'default' : 'outline'}
                size='icon'
                aria-label='Eraser tool'
              >
                <Eraser className='h-4 w-4' />
              </Button>
              <Button
                onClick={() => addShape('rectangle')}
                variant='outline'
                size='icon'
                aria-label='Add rectangle'
              >
                <Square className='h-4 w-4' />
              </Button>
              <Button
                onClick={() => addShape('circle')}
                variant='outline'
                size='icon'
                aria-label='Add circle'
              >
                <Circle className='h-4 w-4' />
              </Button>
            </div>
          </div>
          <div className='relative w-full' style={{ paddingBottom: '75%' }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseDown={startDrawing}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              className='absolute top-0 left-0 w-full h-full border border-gray-300 cursor-crosshair'
            />
          </div>
          <Button onClick={() => router.push('/rooms')} className='mt-4'>
            Back to Rooms
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
