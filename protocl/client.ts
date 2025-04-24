import { createConnection, type Socket } from "node:net"

class VCProtocol {
  private client: Socket | null = null
  private isReady = false
  private connectionTimer: NodeJS.Timeout | null = null
  private retryCount = 0
  private maxRetries = 3
  private timeoutDuration = 30000
  private host: string
  private port: number

  constructor(port: number, host: string) {
    this.port = port
    this.host = host
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isReady && this.client) {
        this.resetConnectionTimer()
        resolve()
        return
      }

      this.cleanup()

      this.client = createConnection({ port: this.port, host: this.host })

      this.client.on("connect", () => {
        this.isReady = true
        this.retryCount = 0
        console.log("Connected to server")
        this.resetConnectionTimer()
        resolve()
      })

      this.client.on("end", () => {
        console.log("Connection ended")
        this.isReady = false
        this.client = null
        this.tryReconnect().catch((err) => console.error("Failed to reconnect:", err))
      })

      this.client.on("error", (err) => {
        console.error("Connection error:", err.message)
        this.isReady = false
        reject(err)
      })

      this.client.on("data", (data) => {
        console.log("Received data:", data.toString())
        this.resetConnectionTimer()
      })
    })
  }

  private async tryReconnect(): Promise<void> {
    if (this.retryCount >= this.maxRetries) {
      console.log("Max retries reached, giving up")
      return
    }

    this.retryCount++
    console.log(`Retry attempt ${this.retryCount}/${this.maxRetries}`)

    try {
      await this.connect()
    } catch (err) {
      console.error(`Reconnect attempt ${this.retryCount} failed:`, err)
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000)
      await new Promise((resolve) => setTimeout(resolve, delay))
      await this.tryReconnect()
    }
  }

  private resetConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
    }

    this.connectionTimer = setTimeout(() => {
      console.log(`No activity for ${this.timeoutDuration / 1000} seconds, closing connection`)
      this.cleanup()
    }, this.timeoutDuration)
  }

  private cleanup(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }

    if (this.client) {
      this.client.removeAllListeners()
      this.client.end()
      this.client.destroy()
      this.client = null
    }

    this.isReady = false
  }

  async send(data: string): Promise<void> {
    try {
      await this.connect()

      if (!this.client || !this.isReady) {
        throw new Error("Not connected to server")
      }

      const payload = `[SOF]\n${data}\n[EOF]`
      this.client.write(Buffer.from(payload))
      console.log("Message sent successfully")

      this.resetConnectionTimer()
    } catch (err) {
      console.error("Failed to send message:", err)
      throw err
    }
  }

  close(): void {
    console.log("Closing connection")
    this.cleanup()
  }
}

export default VCProtocol
