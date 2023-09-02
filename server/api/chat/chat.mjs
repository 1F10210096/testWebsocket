import ws from 'ws';

const { Server } = ws;

const wss = new Server({ port: 5000 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // クライアントからのメッセージを受信した時の処理
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    // クライアントにメッセージを送信
    ws.send(`Server: ${message}`);
  });

  // クライアントが切断した時の処理
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
