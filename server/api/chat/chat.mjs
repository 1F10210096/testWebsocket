import http from 'http';
import WebSocket from 'ws';

const server = http.createServer((req, res) => {
  // HTTPサーバーの設定
  // ...
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (socket) => {
  // WebSocket接続の設定
  // ...

  socket.on('message', (message) => {
    console.log('Received message:', message);

    // 応答メッセージを生成
    const responseMessage = {
      type: 'text',
      text: `You sent: ${message}`,
      timestamp: new Date().toISOString(),
    };

    // クライアントへメッセージを送信
    socket.send(JSON.stringify(responseMessage));
  });
});

const port = 8000;
server.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
