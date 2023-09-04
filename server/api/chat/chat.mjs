import http from 'http';
import { Server } from 'socket.io';
try {
  const server = http.createServer();
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000', // クライアントのオリジン
      methods: ['GET', 'POST'], // 許可するHTTPメソッド
    },
  });

  const port = 8000;
  server.listen(port, () => {
    console.log('Listening on port 8000...');
  });
  io.on('connection', (socket) => {
    // メッセージを受け取った時
    socket.on('message', (message) => {
      // 誰から送られたかわかるようにしておく
      message.from = socket.id;
      // 全員に送る
      io.emit('message', message);
    });
  });
} catch (error) {
  console.log(error, 'eoor');
}
