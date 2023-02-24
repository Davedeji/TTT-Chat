const CIRCLE = "CIRCLE"
const CROSS = "CROSS"
const EMPTY = "EMPTY"
const express = require('express');
const PORT = 4000;
const app = express();

const http = require('http').Server(app);
const cors = require('cors');

const initializedPositions = [
  EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY
];
var positions = initializedPositions;
var playerTurn = CROSS;
var gameInProgress = false;
var player1 = {clientID: null, playAs: CROSS};
var player2 = {clientID: null, playAs: CIRCLE};
var spectate = [];

app.use(cors());

const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:5173",
    }
});

socketIO.on('connection', (socket) => {
    addClient(socket);
    socket.on('message', (data) => {
        console.log(data);
        socketIO.emit('messageResponse', data);
      });
    socket.on('disconnect', () => {
      console.log(`🔥: A user disconnected ${socket.id}`);
      removeClient(socket);
      logPlayers();
    });
    socket.on('playerMove', (index, player) => {
        handlePlayerMove(index, player);
    });
});

const addClient = (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);
    switch (null) {
      case player1.clientID:
        setPlayer(socket, player1);
        break;
      case player2.clientID:
        setPlayer(socket, player2);
        break;
      default:
        setPlayer(socket, null);
        break;
    }
    setGameInProgress();
    sendGameboardUpdate();
};
const setPlayer = (socket, player) => {
  if (player === null) {
    spectate.push(socket.id);
  }
  else {
    player.clientID = socket.id;
    socketIO.to(player.clientID).emit('myPlayerUpdate', player.playAs);
  }
  console.log('🚀: setPlayer -> player', player);
}
const removeClient = (socket) => {
    if (player1.clientID === socket.id) {
      player1.clientID = null;
    } else if (player2.clientID === socket.id) {
      player2.clientID = null;
    }
    else {
        spectate.splice(spectate.indexOf(socket.id), 1);
    }
    if (player1.clientID === null && player2.clientID === null) {
      resetGame();
    }
    socketIO.to(socket.id).emit('myPlayerUpdate', null);
    setGameInProgress();
};

const resetGame = () => {
  positions = initializedPositions;
  playerTurn = CROSS;
  gameInProgress = false;
  console.log('🚀: resetGame ');
}

const setGameInProgress = () => {
  if (player1.clientID !== null && player2.clientID !== null) {
    gameInProgress = true;
  }
  else {
    gameInProgress = false;
  }
  socketIO.emit('gameStarted', gameInProgress);
};

const logPlayers = () => {
  console.log('🚀: logPlayers -> player1', player1);
  console.log('🚀: logPlayers -> player2', player2);
  console.log('🚀: logPlayers -> spectate', spectate);
};

const winningCombinations = [
[0, 1, 2], [3, 4, 5], [6, 7, 8], 
[0, 3, 6], [1, 4, 7], [2, 5, 8], 
[0, 4, 8], [2, 4, 6]
]
const handlePlayerMove = (index, player) => {
  if (playerTurn != player) {
    return;
  }
  console.log('🚀: handlePlayerMove -> index, player', index, player)
  const updatedPositions = [...positions];
  updatedPositions[index] = player;
  positions = updatedPositions;
  playerTurn = (player === CIRCLE) ? CROSS : CIRCLE;

  // push gameUpdate to clients
  sendGameboardUpdate();
};

const sendGameboardUpdate = () => {
  socketIO.emit('gameUpdate', positions, playerTurn, checkGameWinner(), gameInProgress);
};

const checkGameWinner = () => {
  for (const i in winningCombinations) {
    const [a, b, c] = winningCombinations[i];
    if (positions[a] === positions[b] && positions[b] === positions[c] && positions[a] !== EMPTY) {
      const ret = positions[a];
      positions = initializedPositions;
      return ret;
    }
  }

  if (positions.every((position) => position !== EMPTY)) {
    const ret = EMPTY;
    positions = initializedPositions;
    return ret;
  }
  return null;
};

app.get('/api', (req, res) => {
  res.json({
    message: 'Hello world',
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});