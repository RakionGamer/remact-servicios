const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Inicializa Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Inicializa Socket.IO en el mismo servidor HTTP
  const io = new Server(server, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    transports: ['websocket'],
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
    });
    
    socket.on('send-message', (data) => {
      io.to(data.roomId).emit('receive-message', data);
    });
    
    socket.on('presupuesto-updated', (data) => {
      io.to(data.roomId).emit('presupuesto-updated-broadcast', data);
    });
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Servidor Listo en http://${hostname}:${port} (Con WebSockets puros)`);
  });
});
