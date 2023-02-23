import './App.css'
import Square from './components/Square'
import { useEffect, useState } from 'react'
import { CIRCLE, CROSS, EMPTY } from './constants';
import io from 'socket.io-client';
import ChatBody from './components/ChatBody';
import ChatFooter from './components/ChatFooter';
import useScrollBlock from './useScrollBlock';

const socket = io("http://localhost:4000");

const App = () => {
  /**
   * currentPlayer: CIRCLE
   */
  // const [currentPlayer, setCurrentPlayer] = useState(CIRCLE)
  const [myPlayer, setMyPlayer] = useState(null);
  const [positions, setPositions] = useState([
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY
  ]);
  const [winner, setWinner] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  const handlePlayerMove = (position) => {
    if (gameStarted === false) {
      alert('Game has not started yet. Please wait for the other player to join.');
      return;
    }
    if (myPlayer === null) {
      return;
    }

    socket.emit('playerMove', position, myPlayer);
  };

  const onConnection = () => {
    console.log('Connected to server');
    // retrieve current game state
    socket.emit('getGameState');
    // listen for game state
  }

  useEffect(() => {
    socket.on('gameUpdate', (newPositions, currentPlayer, gameWinner, gameInProgress) => {
      console.log('gameUpdate', newPositions, currentPlayer);
      setPositions(newPositions);
      // setCurrentPlayer(currentPlayer);
      setWinner(gameWinner);
      setGameStarted(gameInProgress);
    })
    socket.on('gameStarted', (booleanVal) => {
      setGameStarted(booleanVal);
    })
    socket.on('myPlayerUpdate', (player) => {
      console.log('myPlayerUpdate', player);
      setMyPlayer(player);
    })
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
        {/* Game Results */}
        {winner}
      </div>
      <div className="game_chat">
        {/* <h2>Cat</h2> */}
        <ChatBody/>
        <ChatFooter/>
      </div>

      
    </div>
  )
}

export default App
