import './App.css'
import Square from './components/Square'
import { useCallback, useEffect, useState, useRef } from 'react'
import { CROSS, EMPTY } from './constants';
import ChatBody from './components/ChatBody';
import ChatFooter from './components/ChatFooter';
const URL = "wss://qrhbqpzwsb.execute-api.us-west-2.amazonaws.com/production"

const App = () => {
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [myPlayer, setMyPlayer] = useState(null);
  const [positions, setPositions] = useState([
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY
  ]);
  const [playerTurn, setPlayerTurn] = useState(CROSS);
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [messages, setMessages] = useState([]);

  const onSocketOpen = useCallback(() => {
    setIsConnected(true);
    setTimeout(pingForID, 3000);
  }, []);

  function pingForID () {
    socket.current?.send(JSON.stringify({
      action: '$default',
    }));
  };

  const onSocketMessage = useCallback((event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'gameUpdate':
        console.log('gameUpdate', data.gameUpdate);
        setPositions(data.gameUpdate.positions);
        setWinner(data.gameUpdate.winner);
        setGameStarted(data.gameUpdate.gameInProgress);
        setPlayerTurn(data.gameUpdate.playerTurn);
        break;
      case 'gameStarted':
        console.log('gameStarted', data.gameStarted);
        setGameStarted(data.gameStarted);
        break;
      case 'myPlayerUpdate':
        console.log('myPlayerUpdate', data.myPlayerUpdate);
        setMyPlayer(data.myPlayerUpdate.playAs);
        localStorage.setItem('userName', data.myPlayerUpdate.setID);
        localStorage.setItem('socketID', data.myPlayerUpdate.setID);
        break;
      case 'messageResponse':
        newMessage(data);
        break;
      case 'publicMessage':
        console.log('publicMessage', data.publicMessage);
        break;
      default:
        break;
    }
  }, []);

  const newMessage = useCallback((data) => {
      setMessages(messages => [...messages, data]);
  }, [messages]);
 
  const onSocketClose = useCallback(() => {
    setIsConnected(false);
  }, []);

  const onConnect = useCallback(() => {
    if (socket.current?.readyState !== WebSocket.OPEN ) {
      socket.current = new WebSocket(URL);
      socket.current.addEventListener('open', () => {
        onSocketOpen();
      });
      socket.current.addEventListener('message', (event) => {
        onSocketMessage(event);
      });
      socket.current.addEventListener('close', onSocketClose);
    }
  }, []);

  const checkValidMove = () => {
    if (!isConnected) {
      alert('Game is loading. Please wait a moment.');
      return false;
    }
    if (gameStarted === false) {
      alert('Game has not started yet. Please wait for the other player to join.');
      return false;
    }
    if (myPlayer === null) {
      alert('You are not a player in this game.');
      return false;
    }
    if (playerTurn !== myPlayer) {
      alert('It is not your turn.');
      return false;
    }
    return true;
  };

  const handlePlayerMove = (position) => {
    if (!checkValidMove()) {
      return;
    }

    let data = {
      action: 'playerMove',
      index: position,
      player: myPlayer,
    }
    socket.current?.send(JSON.stringify(data));
    setPositions(positions.map((item, index) => {
      if (index === position) {
        return myPlayer;
      }
      return item;
    }));
  };

  useEffect(() => {
    onConnect();
  }, []);

  return (
    <div className="App">
      <div className="game_section">
        <h1 className='app_heading'>Tic Tac Toe</h1>
        <div className="game_board">
          {
            positions.map((position, index) => (
              <Square 
                key={index * 430} 
                position={index} 
                value = {position}
                handlePlayerMove = {handlePlayerMove}/>
            ))
          }
        </div>
        {/* Game Data */}
        {gameStarted === false && <h2>Waiting for other player to join...</h2>}
        {playerTurn !== myPlayer && gameStarted && myPlayer !== null &&<h2>Waiting for other player to move...</h2>}
        {myPlayer === null && gameStarted && <h2>Spectating</h2>}
        {playerTurn === myPlayer && gameStarted && <h2>It's your turn!</h2>}
        {winner !== null && <h2>{winner === 'EMPTY' ? 'Tie Game' : `Winner is ${winner}`}</h2>}
      </div>
      <div className="game_chat">
        <ChatBody messages={messages}/>
        <ChatFooter socket={socket}/>
      </div>

      
    </div>
  )
}

export default App
