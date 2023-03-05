// import * as AWS from "@aws-sdk/client-apigatewaymanagementapi";
const {
  ApiGatewayManagementApiClient
} = require("@aws-sdk/client-apigatewaymanagementapi-node/ApiGatewayManagementApiClient");
const {
  PostToConnectionCommand
} = require("@aws-sdk/client-apigatewaymanagementapi-node/commands/PostToConnectionCommand");
const admin = require('firebase-admin');
const serviceAccount = require('serviceAccount.json');
  
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const ENDPOINT = 'https://qrhbqpzwsb.execute-api.us-west-2.amazonaws.com/production/';
const client = new ApiGatewayManagementApiClient({endpoint: ENDPOINT});

const names = {};
const initializedPositions = [
    "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"
  ];
  var positions = initializedPositions;
  var playerTurn = "CROSS";
  var gameInProgress = false;
  var player1 = {clientID: null, playAs: "CROSS"};
  var player2 = {clientID: null, playAs: "CIRCLE"};
  var spectate = [];

const sendToAll = async (ids, body) => {
    const promises = ids.map(id => {
        return sendToOne(id, body);
    });
    await Promise.all(promises);
    console.log('🚀: sendToAll -> message sent', ids, body);
};
const sendToOne = async (id, body) => {
    try {
        const postToConnectionCommand = new PostToConnectionCommand({
          ConnectionId: id,
          Data: JSON.stringify(body)
        });
        client.send(postToConnectionCommand).then(data => {
            // do something
            console.log('🚀: sendToOne -> messageSent', data);
        }).catch(error => {
            // error handling
        })
        // await client.postToConnection();
    }
    catch (e) {
        console.log('🚀: sendToOne -> e', e);
    }
    
};

////////////////////////////////////////
const addClient = async (socketID) => {
    console.log(`⚡: ${socketID} user just connected!`);
    switch (null) {
      case player1.clientID:
        console.log('🚀: addClient -> player1.clientID', player1.clientID);
        setPlayer(socketID, player1);
        break;
      case player2.clientID:
        console.log('🚀: addClient -> player2.clientID', player2.clientID);
        setPlayer(socketID, player2);
        break;
      default:
        setPlayer(socketID, null);
        break;
    }
    // await sendToAll([socketID], {type: "setID", setID: socketID});
    // await sendToOne(socketID, {type: "setID", setID: socketID});
    sendToAll(Object.keys(names), {type: "publicMessage", publicMessage: `⚡: ${socketID} user just connected!`});
    setGameInProgress();
    sendGameboardUpdate();
};
const setPlayer = async (socketID, player) => {
  if (player === null) {
    spectate.push(socketID);
  }
  else {
    player.clientID = socketID;
    // broadcast player update
    // socketIO.to(player.clientID).emit('myPlayerUpdate', player.playAs);
    // await new Promise(resolve => setTimeout(resolve, 1000)); 
    sendToAll([socketID], {type: 'myPlayerUpdate', myPlayerUpdate: {playAs: player.playAs, setID: socketID}});
    // await sendToOne(socketID, {type: 'myPlayerUpdate', myPlayerUpdate: player.playAs});
  }
  console.log('🚀: setPlayer -> player', player);
  // await saveGameData();
}
const removeClient = async (socketID) => {
    console.log(`⚡: ${socketID} user just disconnected!`);
    if (player1.clientID === socketID) {
      player1.clientID = null;
    } else if (player2.clientID === socketID) {
      player2.clientID = null;
    }
    else {
        spectate.splice(spectate.indexOf(socketID), 1);
    }
    if (player1.clientID === null && player2.clientID === null) {
      resetGame();
    }
    // broadcast player update
    // socketIO.to(socket.id).emit('myPlayerUpdate', null);
    sendToAll([socketID], {myPlayerUpdate: {playAs: null, setID: null}});
    // await sendToOne(socketID, {myPlayerUpdate: null});
    setGameInProgress();
    sendGameboardUpdate();
    // saveGameData();
};

const resetGame = () => {
  positions = initializedPositions;
  playerTurn = "CROSS";
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
  // broadcast game start update
//   socketIO.emit('gameStarted', gameInProgress);
  sendToAll(Object.values(names), {gameStarted : gameInProgress});
  // saveGameData();
  console.log('🚀: setGameInProgress -> gameInProgress', gameInProgress);
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
  playerTurn = (player === "CIRCLE") ? "CROSS" : "CIRCLE";

  // push gameUpdate to clients
  sendGameboardUpdate();
  saveGameData();
};

const sendGameboardUpdate = () => {
    // broadcast game update
//   socketIO.emit('gameUpdate', positions, playerTurn, checkGameWinner(), gameInProgress);
  const winner = checkGameWinner();
  sendToAll(Object.keys(names), {type: 'gameUpdate', gameUpdate: {positions, playerTurn, winner, gameInProgress}});
};

const checkGameWinner = () => {
  for (const i in winningCombinations) {
    const [a, b, c] = winningCombinations[i];
    if (positions[a] === positions[b] && positions[b] === positions[c] && positions[a] !== "EMPTY") {
      const ret = positions[a];
      positions = initializedPositions;
      return ret;
    }
  }

  if (positions.every((position) => position !== "EMPTY")) {
    const ret = "EMPTY";
    positions = initializedPositions;
    return ret;
  }
  return null;
};

// const retrieveGameData = () => {
//   db.collection('tic-tac-data').doc('test').get().then((doc) => {
//     if (doc.exists) {
//       console.log('🚀: retrieveGameData -> doc.data()', doc.data());
//     }
//     else {
//       console.log('🚀: retrieveGameData -> No such document!');
//     }
//   }).catch((error) => {
//     console.log('🚀: retrieveGameData -> Error getting document:', error);
//   });

// }
const saveGameData = async () => new Promise((resolve, reject) =>{
  console.log('🚀: saveGameData -> saving game data');
  const data = {
    player1: JSON.stringify(player1),
    player2: JSON.stringify(player2),
    positions: JSON.stringify(positions),
    playerTurn: JSON.stringify(playerTurn),
    gameInProgress: JSON.stringify(gameInProgress),
    spectate: JSON.stringify(spectate)
  }
  db.collection('tic-tac-data').doc('game-data').set({
    data
  }).then(() => {
    console.log('🚀: saveGameData -> Document successfully written!');
    resolve();
  }).catch((error) => {
    console.error('🚀: saveGameData -> Error writing document: ', error);
    reject();
  });
  console.log('🚀: saveGameData -> Saved game data');
});

const retrieveGameData = async () => new Promise((resolve, reject) => {

    db.collection('tic-tac-data').doc('game-data').get().then((doc) => {
      if (doc.exists) {
        console.log('🚀: retrieveGameData -> doc.data()', doc.data());
        const data = doc.data().data;
        player1 = JSON.parse(data.player1);
        player2 = JSON.parse(data.player2);
        positions = JSON.parse(data.positions);
        playerTurn = JSON.parse(data.playerTurn);
        gameInProgress = JSON.parse(data.gameInProgress);
        spectate = JSON.parse(data.spectate);
        console.log('🚀: retrieveGameData -> player1', player1);
        console.log('🚀: retrieveGameData -> player2', player2);
        console.log('🚀: retrieveGameData -> positions', positions);
        console.log('🚀: retrieveGameData -> playerTurn', playerTurn);
        console.log('🚀: retrieveGameData -> gameInProgress', gameInProgress);
        console.log('🚀: retrieveGameData -> spectate', spectate);
      }
      else {
        console.log('🚀: retrieveGameData -> No such document!');
      }
      resolve();
    }).catch((error) => {
      console.log('🚀: retrieveGameData -> Error getting document:', error);
      reject();
    });
  });

// exports.handler = (event, context, callback) => {
//   // Write a simple document with two fields
//   const data = {
//     message: "Hello, world!",
//     timestamp: new Date()
//   };

//   db.collection('lambda-docs').add(data).then((ref) => {
//     // On a successful write, return an object
//     // containing the new doc id.
//     callback(null, {
//       id: ref.id
//     });
//   }).catch((err) => {
//     // Forward errors if the write fails
//     callback(err);
//   });


exports.handler = async (event, context, callback) => {   
    // firebaseFirestore = admin.firestore();
    // console.log('🚀: handler -> firestpre', db);
    await retrieveGameData();
    console.log('🚀: handler -> continue');
    console.log('🚀: handler -> names', names);

    if (event.requestContext) {
        const connectionId = event.requestContext.connectionId;
        const routeKey = event.requestContext.routeKey;
        console.log('🚀: handler -> routeKey', routeKey);
        let body = {};
        try {
            if (event.body) {
                body = JSON.parse(event.body);
                console.log('🚀: handler -> body', body);
            }
        }
        catch (e) {
            console.log(e);
        }
        

        switch (routeKey) {
            case '$connect':
                names[connectionId] = 'anonymous';
                await addClient(connectionId);
                // await new Promise(resolve => setTimeout(resolve, 500)); 
                // await sendToAll([connectionId], {type: 'ping', ping: null});

                // saveGameData();
                // retrieveGameData();
                
                break;
            case '$disconnect':
                delete names[connectionId];
                removeClient(connectionId);
                break;
            case '$default':
                console.log('🚀: handler -> default: Request for ID', connectionId, player1.clientID, player2.clientID);
                if (connectionId === player1.clientID) {
                  console.log('🚀: handler: Request for ID: player1');
                  await sendToAll([connectionId], {type: 'myPlayerUpdate', myPlayerUpdate: {playAs: player1.playAs, setID: player1.clientID}});
                }
                else if (connectionId === player2.clientID) {
                  console.log('🚀: handler: Request for ID: player2');
                  await sendToAll([connectionId], {type: 'myPlayerUpdate', myPlayerUpdate: {playAs: player2.playAs, setID: player2.clientID}});
                }
                else if (connectionId in spectate) {
                  console.log('🚀: handler: Request for ID: spectate');
                  await sendToAll([connectionId], {type: 'myPlayerUpdate', myPlayerUpdate: {playAs: null, setID: connectionId}});
                }
                break;
            case 'playerMove':
                console.log('🚀: handler -> playermove', body);
                handlePlayerMove(body.index, body.player);
                break;
            case 'sendMessage':
                const messageData = {
                    type: 'messageResponse',
                    text: body.text,
                    name: body.name,
                    id: body.id,
                    socketID: body.socketID
                }
                await sendToAll(Object.keys(names), messageData);
                break;
            case 'setName':
                break;
            default:
                break;
        }
    }


    await saveGameData();

    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};