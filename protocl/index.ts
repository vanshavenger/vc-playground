import { createServer, type Server, type Socket } from "node:net"

class VCServer {
  private server: Server
  private connections: Map<string, Socket> = new Map()
  private connectionTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private timeoutDuration = 30000

  constructor(private port: number) {
    this.server = createServer((socket) => this.handleConnection(socket))

    this.setupServerEvents()
  }

  private setupServerEvents(): void {
    this.server.on("error", (err) => {
      console.error("Server error:", err)
    })

    this.server.on("close", () => {
      console.log("Server closed")
      this.closeAllConnections()
    })

    process.on("SIGINT", () => this.shutdown())
    process.on("SIGTERM", () => this.shutdown())
  }

  private handleConnection(socket: Socket): void {
    const clientId = `${socket.remoteAddress}:${socket.remotePort}`
    console.log(`Client connected: ${clientId}`)

    this.connections.set(clientId, socket)

    this.resetConnectionTimeout(clientId, socket)

    let buffer = ""

    socket.on("data", (data) => {
      this.resetConnectionTimeout(clientId, socket)

      const message = data.toString()
      buffer += message

      this.processBuffer(clientId, socket, buffer)

      if (buffer.includes("[EOF]")) {
        buffer = ""
      }
    })

    socket.on("error", (err) => {
      console.error(`Error on connection ${clientId}:`, err.message)
      this.cleanupConnection(clientId)
    })

    socket.on("end", () => {
      console.log(`Client disconnected: ${clientId}`)
      this.cleanupConnection(clientId)
    })

    socket.on("close", (hadError) => {
      if (hadError) {
        console.log(`Connection ${clientId} closed due to error`)
      } else {
        console.log(`Connection ${clientId} closed`)
      }
      this.cleanupConnection(clientId)
    })
  }

  private processBuffer(clientId: string, socket: Socket, buffer: string): void {
    if (buffer.includes("[SOF]") && buffer.includes("[EOF]")) {
      try {
        const startIndex = buffer.indexOf("[SOF]") + "[SOF]".length
        const endIndex = buffer.indexOf("[EOF]")

        if (startIndex > -1 && endIndex > -1 && endIndex > startIndex) {
          const message = buffer.substring(startIndex, endIndex).trim()
          console.log(`Received message from ${clientId}: ${message}`)

          this.sendResponse(socket, `Received your message: ${message}`)
        }
      } catch (err) {
        console.error(`Error processing message from ${clientId}:`, err)
      }
    }
  }

  private sendResponse(socket: Socket, message: string): void {
    try {
      const response = `[SOF]\n${message}\n[EOF]`
      socket.write(Buffer.from(response))
    } catch (err) {
      console.error("Error sending response:", err)
    }
  }

  private resetConnectionTimeout(clientId: string, socket: Socket): void {
    if (this.connectionTimeouts.has(clientId)) {
      clearTimeout(this.connectionTimeouts.get(clientId)!)
    }

    const timeout = setTimeout(() => {
      console.log(`Connection ${clientId} timed out after ${this.timeoutDuration / 1000} seconds of inactivity`)
      socket.end()
      this.cleanupConnection(clientId)
    }, this.timeoutDuration)

    this.connectionTimeouts.set(clientId, timeout)
  }

  private cleanupConnection(clientId: string): void {
    if (this.connectionTimeouts.has(clientId)) {
      clearTimeout(this.connectionTimeouts.get(clientId)!)
      this.connectionTimeouts.delete(clientId)
    }

    this.connections.delete(clientId)
  }

  private closeAllConnections(): void {
    for (const timeout of this.connectionTimeouts.values()) {
      clearTimeout(timeout)
    }
    this.connectionTimeouts.clear()

    for (const [clientId, socket] of this.connections.entries()) {
      console.log(`Closing connection: ${clientId}`)
      socket.end()
      socket.destroy()
    }
    this.connections.clear()
  }

  start(): void {
    this.server.listen(this.port, () => {
      console.log(`Server is listening on port ${this.port}`)
    })
  }

  shutdown(): void {
    console.log("Shutting down server gracefully...")

    this.closeAllConnections()

    this.server.close(() => {
      console.log("Server shutdown complete")
      process.exit(0)
    })

    setTimeout(() => {
      console.error("Forced shutdown after timeout")
      process.exit(1)
    }, 5000)
  }
}

export default VCServer
