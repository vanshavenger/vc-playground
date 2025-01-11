import { WebSocketServer } from "ws";
import { CONFIG, EVENTS } from "./constants";

const wss = new WebSocketServer({ port: CONFIG.PORT });

wss.on(EVENTS.CONNECTION, (ws) => {
  console.log("New client connected");

  ws.on(EVENTS.MESSAGE, (data) => {
    console.log("Received:", data.toString());
    ws.send(`Server received: ${data}`);
  });

  ws.on(EVENTS.CLOSE, () => {
    console.log("Client disconnected");
  });

  ws.on(EVENTS.ERROR, (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log(
  `WebSocket server is running on ws://${CONFIG.HOST}:${CONFIG.PORT}`,
);
