import VCServer from "."
import VCProtocol from "./client"


const server = new VCServer(8080)
server.start()

async function runClient() {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const client = new VCProtocol(8080, "localhost")

  try {
    await client.send("Hello from client")

    setTimeout(async () => {
      await client.send("Second message within timeout")
    }, 15000)

    setTimeout(async () => {
      await client.send("Message after timeout")
    }, 55000)

    setTimeout(() => {
      client.close()
    }, 400000)
  } catch (err) {
    console.error("Client error:", err)
  }
}


runClient().catch((err) => {
  console.error("Error in client:", err)
})