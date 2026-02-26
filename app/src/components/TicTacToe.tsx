import { X, Circle } from 'lucide-react';

type Cell = 'X' | 'O' | null;

interface TicTacToeProps {
    isMyTurn: boolean;
    mySymbol: 'X' | 'O';
    onMove: (index: number) => void;
    onLeave: () => void;
    board: Cell[];
    winner: 'X' | 'O' | 'draw' | null;
    gameOver: boolean;
}

export function TicTacToe({ isMyTurn, mySymbol, onMove, onLeave, board, winner, gameOver }: TicTacToeProps) {
    const opponentSymbol = mySymbol === 'X' ? 'O' : 'X';

    const getStatusText = () => {
        if (winner === 'draw') return "It's a draw!";
        if (winner === mySymbol) return '🎉 You won!';
        if (winner === opponentSymbol) return 'You lost!';
        return isMyTurn ? 'Your turn' : "Stranger's turn";
    };

    const getStatusColor = () => {
        if (winner === mySymbol) return 'text-neon-green';
        if (winner === opponentSymbol) return 'text-red-400';
        if (winner === 'draw') return 'text-yellow-400';
        return isMyTurn ? 'text-neon-cyan' : 'text-text-secondary';
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Header */}
            <div className="flex items-center justify-between w-full max-w-[280px]">
                <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-lg text-text-primary">Tic-Tac-Toe</span>
                </div>
                <button
                    onClick={onLeave}
                    className="font-mono text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded border border-red-400/30 hover:border-red-400/60"
                >
                    Leave
                </button>
            </div>

            {/* Your symbol */}
            <div className="font-mono text-xs text-text-secondary">
                You are <span className="text-neon-cyan font-bold">{mySymbol}</span>
            </div>

            {/* Board */}
            <div className="grid grid-cols-3 gap-1.5 w-[240px] h-[240px] md:w-[280px] md:h-[280px]">
                {board.map((cell, i) => (
                    <button
                        key={i}
                        onClick={() => !gameOver && isMyTurn && !cell && onMove(i)}
                        disabled={gameOver || !isMyTurn || !!cell}
                        className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${cell
                            ? 'border-white/20 bg-white/5'
                            : isMyTurn && !gameOver
                                ? 'border-neon-cyan/30 bg-neon-cyan/5 hover:bg-neon-cyan/15 hover:border-neon-cyan/50 cursor-pointer'
                                : 'border-white/10 bg-white/[0.02] cursor-not-allowed'
                            }`}
                    >
                        {cell === 'X' && <X className={`w-10 h-10 md:w-12 md:h-12 ${cell === mySymbol ? 'text-neon-cyan' : 'text-red-400'} stroke-[2.5]`} />}
                        {cell === 'O' && <Circle className={`w-9 h-9 md:w-11 md:h-11 ${cell === mySymbol ? 'text-neon-cyan' : 'text-red-400'} stroke-[2.5]`} />}
                    </button>
                ))}
            </div>

            {/* Status */}
            <div className={`font-mono text-sm font-semibold ${getStatusColor()}`}>
                {getStatusText()}
            </div>
        </div>
    );
}

// Game logic helper
export function checkWinner(board: Cell[]): 'X' | 'O' | 'draw' | null {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
        [0, 4, 8], [2, 4, 6],            // diags
    ];
    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]!;
        }
    }
    if (board.every(cell => cell !== null)) return 'draw';
    return null;
}
