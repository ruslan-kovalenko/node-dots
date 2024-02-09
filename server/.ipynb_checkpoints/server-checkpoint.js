const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', "POST"]
  }
});

const users = [];
let storagePlayerOne = [];
let storagePlayerTwo = [];
let chainsPlayerOne = [];
let chainsPlayerTwo = [];
let playerOneScore = 0;
let playerTwoScore = 0;
let nodeStorage = [];

io.on('connection', (socket) => {
  console.log(`user ${socket.id} is connected.`)

  socket.on('send-player-storage', (data) => {
    const { storage, score, chains } = data;
    const playerOrder = storage[0].player.order;

    if (playerOrder === 1) {
      storagePlayerOne = storage;
      playerOneScore = score;
      chainsPlayerOne = [...chainsPlayerOne, ...chains];
    }
    else {
      storagePlayerTwo = storage;
      playerTwoScore = score;
      chainsPlayerTwo = [...chainsPlayerTwo, ...chains];
    }

    nodeStorage = [...storagePlayerOne, ...storagePlayerTwo];

    io.emit('get-node-storage', { 
      storage: nodeStorage, 
      playerOneScore, 
      playerTwoScore, 
      chains: [...chainsPlayerOne, ...chainsPlayerTwo]
    });
  });
  
  socket.on('send-new-node', (node) => {
    io.emit('get-new-node', node);
  })

  socket.on('disconnect', () => {
    console.log(`user ${socket.id} left.`)
    storagePlayerOne = [];
    storagePlayerTwo = [];
    chainsPlayerOne = [];
    chainsPlayerTwo = [];
    playerOneScore = 0;
    playerTwoScore = 0;
    nodeStorage = [];
  });
  

  const registeredUserId = socket.handshake.query.userId;
  const connectedUser = users.some(user => user.id === registeredUserId);

  if (users.length < 2) {
    const userObj = { 
      id: socket.id, 
      order: !users.length ? 1 : 2, 
      color: !users.length ? 'rgba(19, 97, 226, 1)' : 'rgba(228, 23, 71, 1)' 
    };

    socket.emit('register-player', userObj);
    users.push(userObj);
    io.emit('users', users);
  } 
  else {
    const user = users.find(user => user.id === socket.handshake.query.userId);
    socket.emit('register-player', user);
    io.emit('users', users);
  }
})

server.listen(3000, () => {
  console.log('Chat server is running on 3000')
})