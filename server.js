const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*" // Allow connections from any origin (replace with your React app's URL for production)
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('addShape', (shape) => {
    // Broadcast the shape to all other connected clients
    socket.broadcast.emit('shapeAdded', shape); 
  });

  socket.on('updateShape', (shape) => {
    // Broadcast the updated shape
    socket.broadcast.emit('shapeUpdated', shape); 
  });

  socket.on('clearCanvas', () => {
    // Broadcast the clear event
    socket.broadcast.emit('canvasCleared'); 
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3004; // Changed port to 3004
server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});