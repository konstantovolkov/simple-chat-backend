import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({
  port: parseInt(process.env.PORT || ''),
  path: '/chat'
});

const history: { text: string; id: string }[] = [];

interface ClientData {
  message: string;
}

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
      message: {
        text: 'Welcome to the chat!',
        id: uuidv4(),
      },
      history
    }
  }))
});