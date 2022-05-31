import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

const PING_INTERVAL = 30000;

interface PingableWebSocket extends WebSocket {
  isAlive?: boolean;
  id?: string;
}

const history: {
  text: string;
  id: string;
  timestamp: Date;
  authorId?: string;
}[] = [];

interface ClientData {
  message: string;
}

const wss = new WebSocketServer<PingableWebSocket>({
  port: parseInt(process.env.PORT || "8080"),
  path: "/chat",
});

const pingTimer = setInterval(() => {
  wss.clients.forEach((client) => {
    if (!client.isAlive) {
      return client.terminate();
    }

    client.isAlive = false;
    client.ping();
  });
}, PING_INTERVAL);

wss.on("connection", (clientWs, req) => {
  clientWs.id = uuidv4();

  clientWs.send(
    JSON.stringify({
      data: {
        history,
        yourAuthorId: clientWs.id,
      },
    })
  );

  clientWs.isAlive = true;

  clientWs.on("pong", () => {
    clientWs.isAlive = true;
  });

  clientWs.on("message", (data) => {
    const { message } = JSON.parse(data.toString()) as ClientData;

    const newChatMessage = {
      text: message,
      id: uuidv4(),
      authorId: clientWs.id,
      timestamp: new Date(),
    };

    history.push(newChatMessage);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            data: {
              history,
            },
          })
        );
      }
    });
  });
});

wss.on("close", () => {
  clearInterval(pingTimer);
});
