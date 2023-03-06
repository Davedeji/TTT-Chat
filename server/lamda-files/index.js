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

var names = {};
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
            console.log('🚀: sendToOne -> messageSent', data);
        }).catch(error => {
            console.log('🚀: sendToOne -> error', error);
        })
    }
    catch (e) {
        console.log('🚀: sendToOne -> e', e);
    }
    
};

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
    setGameInProgress();
    sendGameboardUpdate();
};
const setPlayer = async (socketID, player) => {
  if (player === null) {
    spectate.push(socketID);
  }
  else {
    player.clientID = socketID;
    sendToAll([socketID], {type: 'myPlayerUpdate', myPlayerUpdate: {playAs: player.playAs, setID: socketID}});
  }
  console.log('🚀: setPlayer -> player', player);
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
    if (player1.clientID === null || player2.clientID === null) {
      resetGame();
    }
    sendToAll([socketID], {myPlayerUpdate: {playAs: null, setID: null}});
    setGameInProgress();
    sendGameboardUpdate();
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
  sendToAll(Object.values(names), {gameStarted : gameInProgress});
  console.log('🚀: setGameInProgress -> gameInProgress', gameInProgress);
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

const saveGameData = async () => new Promise((resolve, reject) =>{
  const data = {
    player1: JSON.stringify(player1),
    player2: JSON.stringify(player2),
    positions: JSON.stringify(positions),
    playerTurn: JSON.stringify(playerTurn),
    gameInProgress: JSON.stringify(gameInProgress),
    spectate: JSON.stringify(spectate),
    names: JSON.stringify(names)
  }
  db.collection('tic-tac-data').doc('game-data').set({
    data
  }).then(() => {
    console.log('🚀: saveGameData -> Document successfully written!');
    resolve();
  }).catch((error) => {
    console.log('🚀: saveGameData -> Error writing document: ', error);
    reject();
  });
  console.log('🚀: saveGameData -> Saved game data');
});

const retrieveGameData = async () => new Promise((resolve, reject) => {

    db.collection('tic-tac-data').doc('game-data').get().then((doc) => {
      if (doc.exists) {
        console.log('🚀: retrieveGameData -> data', doc.data());
        const data = doc.data().data;
        player1 = JSON.parse(data.player1);
        player2 = JSON.parse(data.player2);
        positions = JSON.parse(data.positions);
        playerTurn = JSON.parse(data.playerTurn);
        gameInProgress = JSON.parse(data.gameInProgress);
        spectate = JSON.parse(data.spectate);
        names = JSON.parse(data.names);
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

exports.handler = async (event, context, callback) => {   
    await retrieveGameData();

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
                break;
            case '$disconnect':
                delete names[connectionId];
                removeClient(connectionId);
                break;
            case '$default':
                sendGameboardUpdate();
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
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};