import io from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket1 = null;
    this.socket2 = null;
    this.listeners = {};
  }

  connect(url1, url2) {
    return new Promise((resolve, reject) => {
      this.socket1 = io(url1);
      this.socket2 = io(url2);

      let connectedCount = 0;

      const handleConnect = () => {
        connectedCount++;
        if (connectedCount === 2) {
          console.log('Connected to both servers');
          resolve(); // Resolve the Promise when both are connected
        }
      };

      this.socket1.on('connect', handleConnect);
      this.socket2.on('connect', handleConnect);

      this.socket1.on('disconnect', () => {
        console.log('Disconnected from server 1');
      });

      this.socket2.on('disconnect', () => {
        console.log('Disconnected from server 2');
      });

      // Set up listeners for collaborative events on both sockets
      const setupListeners = (socket) => {
        socket.on('shapeAdded', (shape) => {
          this.emit('shapeAdded', shape);
        });

        socket.on('shapeUpdated', (shape) => {
          this.emit('shapeUpdated', shape);
        });

        socket.on('canvasCleared', () => {
          this.emit('canvasCleared');
        });
      }

      setupListeners(this.socket1);
      setupListeners(this.socket2);
    });
  }

  disconnect() {
    if (this.socket1) {
      this.socket1.disconnect();
    }
    if (this.socket2) {
      this.socket2.disconnect();
    }
  }

  addShape(shape) {
    if (this.socket1) {
      this.socket1.emit('addShape', shape);
    }
    if (this.socket2) {
      this.socket2.emit('addShape', shape);
    }
  }

  updateShape(shape) {
    if (this.socket1) {
      this.socket1.emit('updateShape', shape);
    }
    if (this.socket2) {
      this.socket2.emit('updateShape', shape);
    }
  }

  clearCanvas() {
    if (this.socket1) {
      this.socket1.emit('clearCanvas');
    }
    if (this.socket2) {
      this.socket2.emit('clearCanvas');
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export default new SocketManager();