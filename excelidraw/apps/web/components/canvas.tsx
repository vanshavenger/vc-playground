import { useRef, useEffect, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { DrawingData } from '@/hooks/use-websocket'

interface CanvasProps {
  drawingData: DrawingData[]
  currentTool: string
  currentColor: string
  onDraw: (data: DrawingData) => void
}

export function Canvas({
  drawingData,
  currentTool,
  currentColor,
  onDraw,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const getMousePos = useCallback(
    (canvas: HTMLCanvasElement, evt: MouseEvent | React.MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY,
      }
    },
    []
  )

  const drawOnCanvas = useCallback((data: DrawingData) => {
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
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawingData.forEach(item => drawOnCanvas(item))
  }, [drawingData, drawOnCanvas])

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        const height = width * 0.75
        setCanvasSize({ width, height })
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    const { x, y } = getMousePos(canvas, e)
    lastPoint.current = { x, y }
    if (currentTool === 'pen') {
      draw(x, y, true)
    } else if (currentTool === 'eraser') {
      erase(x, y)
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

    onDraw(drawData)
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

    onDraw(eraseData)
    drawOnCanvas(eraseData)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return

    const canvas = canvasRef.current
    if (!canvas) return
    const { x, y } = getMousePos(canvas, e)
    if (currentTool === 'pen') {
      draw(x, y, false)
    } else if (currentTool === 'eraser') {
      erase(x, y)
    }
    lastPoint.current = { x, y }
  }

  return (
    <motion.div
      ref={containerRef}
      className='relative w-full'
      style={{ paddingBottom: '75%' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        className='absolute top-0 left-0 w-full h-full border border-gray-300 cursor-crosshair'
      />
    </motion.div>
  )
}
