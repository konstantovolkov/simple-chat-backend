import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PING_INTERVAL = 5000;

interface PingableWebSocket extends WebSocket {
  isAlive?: boolean;
}

const history: { text: string; id: string }[] = [];

interface ClientData {
  message: string;
}


const wss = new WebSocketServer<PingableWebSocket>({
  port: parseInt(process.env.PORT || '8080'),
  path: '/chat'
});

const pingTimer = setInterval(() => {
  wss.clients.forEach(client => {
    if (!client.isAlive) {
      return client.terminate();
    }

    client.isAlive = false;
    client.ping();
  })
}, PING_INTERVAL)

wss.on('connection', (clientWs) => {
  clientWs.on('message', (data) => {
    const { message } = JSON.parse(data.toString()) as ClientData;

    const newChatMessage = {
      text: message,
      id: uuidv4()
    }

    history.push(newChatMessage)
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          data: {
            message: newChatMessage,
            history
          }
        }))
      }
    })
  });

  clientWs.send(JSON.stringify({
    data: {
      history
    }
  }))

  clientWs.isAlive = true;

  clientWs.on('pong', () => {
    clientWs.isAlive = true;
  })
});

wss.on('close', () => {
  clearInterval(pingTimer);
})