import dgram from "dgram"

const client = dgram.createSocket("udp4")

const message = "Hello from UDP client!"
const port = 3000
const host = "localhost"

let receivedCount = 0

client.on("message", (msg, rinfo) => {
  console.log(`Received echo: "${msg}" from ${rinfo.address}:${rinfo.port}`)
  receivedCount++
  if (receivedCount === 5) {
    client.close()
  }
})

client.on("listening", () => {
  const address = client.address()
  console.log(`Client listening on ${address.address}:${address.port}`)

  for (let i = 0; i < 5; i++) {
    const msg = `${message} (Message ${i + 1})`
    client.send(msg, port, host, (err) => {
      if (err) {
        console.error("Error sending message:", err)
      } else {
        console.log(`Message sent: "${msg}" to ${host}:${port}`)
      }
    })
  }
})

client.bind(0) 