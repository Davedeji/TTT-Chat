import './App.css'
import Square from './components/Square'
import { useCallback, useEffect, useState, useRef } from 'react'
import uuid from 'react-uuid';
import { CIRCLE, CROSS, EMPTY } from './constants';
// import io from 'socket.io-client';
import ChatBody from './components/ChatBody';
import ChatFooter from './components/ChatFooter';
import useScrollBlock from './useScrollBlock';

// const socket = io("http://localhost:4000");
const URL = "wss://qrhbqpzwsb.execute-api.us-west-2.amazonaws.com/production"

const App = () => {
  // const socket = useRef<WebSocket | null>();
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
  // localStorage.setItem('userName', socket.id);

  const onSocketOpen = useCallback(() => {
    console.log('connected');
    setIsConnected(true);
    setTimeout(pingForID, 3000);
    // while (myPlayer === null) {
    //   // wait for 1000ms before pinging again
      
    // }
  }, []);

   function pingForID () {
    console.log('ping sending')
    socket.current?.send(JSON.stringify({
      action: '$default',
    }));
    console.log('ping sent');
   };


  const onSocketMessage = useCallback((event) => {
    const data = JSON.parse(event.data);
    console.log("Message from server content: ");
    console.log(data);
    // console.log('message', data);
    switch (data.type) {
      case 'setID':
        // localStorage.setItem('userName', data.setID);
        // localStorage.setItem('socketID', data.setID);
        break;
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
        console.log('setID', data.myPlayerUpdate.setID);
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
    console.log('disconnected');
    setIsConnected(false);
  }, []);

  const onConnect = useCallback(() => {
    if (socket.current?.readyState !== WebSocket.OPEN ) {
      socket.current = new WebSocket(URL);
      console.log('socket readyState', socket.current?.readyState);
      socket.current.addEventListener('open', () => {
        console.log('open listener registered');
        onSocketOpen();
      });
      socket.current.addEventListener('message', (event) => {
        console.log('message listener registered', event);
        onSocketMessage(event);
      });
      socket.current.addEventListener('close', onSocketClose);
      console.log('socket Conect Done');
    }
  }, []);

  // const onConnect = useCallback(() => {
  //   if (socket.current?.readyState !== WebSocket.OPEN ) {
  //     socket.current = new WebSocket(URL);
  //     console.log('socket readyState', socket.current?.readyState);
  //     socket.current.addEventListener('open', () => {
  //       console.log('open listener registered');
  //       onSocketOpen();
  //       socket.current.addEventListener('message', (event) => {
  //         console.log('message listener registered', event);
  //         onSocketMessage(event);
  //       });
  //     });
  //     socket.current.addEventListener('close', onSocketClose);
  //     console.log('socket Connect Done');
  //   }
  // }, []);
  

  const onDisconnect = useCallback(() => {
    socket.current?.close();
    console.log('disconnected');
  }, []);

  const checkValidMove = (position) => {
    if (gameStarted === false) {
      alert('Game has not started yet. Please wait for the other player to join.');
      return false;
    }
    if (myPlayer === null) {
      alert('You are not a player in this game. Please wait for the other player to join.');
      return false;
    }
    if (playerTurn !== myPlayer) {
      alert('It is not your turn.');
      return false;
    }
    return true;
  };


  const handlePlayerMove = (position) => {
    if (!checkValidMove(position)) {
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
    
    

    // socket.emit('playerMove', position, myPlayer);
  };
  // onConnect();
  // useEffect(() => {
  //   onConnect();
  // }, [isConnected]);
  useEffect(() => {
    console.log('useEffect');
    onConnect();
    
    // socket.on('gameUpdate', (newPositions, currentPlayer, gameWinner, gameInProgress) => {
    //   console.log('gameUpdate', newPositions, currentPlayer);
    //   setPositions(newPositions);
    //   setWinner(gameWinner);
    //   setGameStarted(gameInProgress);
    // })
    // socket.on('gameStarted', (booleanVal) => {
    //   setGameStarted(booleanVal);
    // })
    // socket.on('myPlayerUpdate', (player) => {
    //   console.log('myPlayerUpdate', player);
    //   setMyPlayer(player);
    // })
  }, []);

  useEffect(() => {
      // socket.on('messageResponse', (data) => setMessages([...messages, data]));
  }, [socket, messages]);

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
        {/* Game Results */}
        {winner}
      </div>
      <div className="game_chat">
        {/* <h2>Cat</h2> */}
        <ChatBody messages={messages}/>
        <ChatFooter socket={socket}/>
      </div>

      
    </div>
  )
}

export default App
