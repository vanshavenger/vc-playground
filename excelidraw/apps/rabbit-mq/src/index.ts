import amqp from 'amqplib'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const RABBITMQ_URL = 'amqp://localhost'
const QUEUE_NAME = 'drawing_queue'

const processQueue = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL)
    const channel = await connection.createChannel()
    // await channel.assertQueue(QUEUE_NAME, { durable: false })

    await channel.consume(QUEUE_NAME, async msg => {
      if (msg !== null) {
        const { roomId, userId, drawingData, type } = JSON.parse(
          msg.content.toString()
        )
        console.log('Received message:', roomId, userId, drawingData, type)

        if (type === 'bulk_save') {
          await saveBulkDrawings(roomId, drawingData)
        } else {
          await saveDrawing(roomId, userId, drawingData)
        }

        channel.ack(msg)
      }
    })
  } catch (err) {
    console.error(err)
  }
}

const saveDrawing = async (
  roomId: string,
  userId: string,
  drawingData: any
) => {
  await prisma.drawing.create({
    data: {
      data: JSON.stringify(drawingData),
      roomId: roomId,
      userId: userId,
    },
  })
}

const saveBulkDrawings = async (roomId: string, drawingData: any[]) => {
  await prisma.drawing.deleteMany({ where: { roomId } })
  await prisma.drawing.createMany({
    data: drawingData.map(d => ({
      data: JSON.stringify(d),
      roomId: roomId,
      userId: d.userID,
    })),
  })
}

async function startQueueConsumer() {
  console.log('Starting queue consumer...')
  await processQueue()
}

startQueueConsumer().catch(console.error)
