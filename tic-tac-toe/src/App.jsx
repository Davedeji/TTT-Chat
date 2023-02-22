import './App.css'
import Square from './components/Square'
import { useEffect, useState } from 'react'
import { CIRCLE, CROSS, EMPTY } from './constants';

const App = () => {

  /**
   * currentPlayer: CIRCLE
   */
  const [currentPlayer, setCurrentPlayer] = useState(CIRCLE)
  const [positions, setPositions] = useState([
      EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY
  ]);
  const [winner, setWinner] = useState(null);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]
  ]

  const handlePlayerMove = (position) => {
    const updatedPositions = [...positions];
    updatedPositions[position] = currentPlayer;
    setPositions(updatedPositions);
    setCurrentPlayer(currentPlayer === CIRCLE ? CROSS : CIRCLE);
  };

  const checkGameWinner = () => {
    for (const i in winningCombinations) {
      const [a, b, c] = winningCombinations[i];
      if (positions[a] === positions[b] && positions[b] === positions[c] && positions[a] !== EMPTY) {
        return positions[a];
      }
    }

    if (positions.every((position) => position !== EMPTY)) {
      return EMPTY;
    }
    return null;
  };

  useEffect(() => {
    const winner = checkGameWinner();
    setWinner(winner);
  });

  return (
    <div className="App">
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
  )
}

export default App
