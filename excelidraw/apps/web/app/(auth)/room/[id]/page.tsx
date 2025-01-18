'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useWebSocket, DrawingData } from '@/hooks/use-websocket'
import { Canvas } from '@/components/canvas'
import { Button } from '@repo/ui/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/ui/card'
import { Input } from '@repo/ui/components/ui/input'
import { Pencil, Eraser, Square, Circle } from 'lucide-react'

export default function Room() {
  const { id } = useParams()
  const router = useRouter()
  const { isConnected, drawingData, error, sendMessage } = useWebSocket(
    id as string
  )

  const [currentColor, setCurrentColor] = useState('#000000')
  const [currentTool, setCurrentTool] = useState<
    'pen' | 'eraser' | 'rectangle' | 'circle'
  >('pen')

  const addShape = (shapeType: 'rectangle' | 'circle') => {
    const shapeData: DrawingData = {
      type: 'add_shape',
      shapeData: {
        type: shapeType,
        x: Math.random() * 800,
        y: Math.random() * 600,
        width: 50,
        height: 50,
        color: currentColor,
      },
    }

    sendMessage(shapeData)
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
            <motion.div
              className='rounded-full h-12 w-12 border-b-2 border-blue-500'
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
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
          <motion.div
            className='mb-4 flex flex-wrap items-center gap-4'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
          </motion.div>
          <Canvas
            drawingData={drawingData}
            currentTool={currentTool}
            currentColor={currentColor}
            onDraw={sendMessage}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button onClick={() => router.push('/rooms')} className='mt-4'>
              Back to Rooms
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
