type Cell = 'R' | 'Y' | null; // Red or Yellow

interface ConnectFourProps {
    board: Cell[][];       // 6 rows × 7 cols
    myColor: 'R' | 'Y';
    isMyTurn: boolean;
    onDrop: (col: number) => void;
    onLeave: () => void;
    winner: 'R' | 'Y' | 'draw' | null;
    gameOver: boolean;
}

export function ConnectFour({ board, myColor, isMyTurn, onDrop, onLeave, winner, gameOver }: ConnectFourProps) {
    const getStatusText = () => {
        if (winner === 'draw') return "It's a draw!";
        if (winner === myColor) return '🎉 You won!';
        if (winner && winner !== myColor) return 'You lost!';
        return isMyTurn ? 'Your turn' : "Stranger's turn";
    };

    const getStatusColor = () => {
        if (winner === 'draw') return 'text-yellow-400';
        if (winner === myColor) return 'text-neon-green';
        if (winner && winner !== myColor) return 'text-red-400';
        return isMyTurn ? 'text-neon-cyan' : 'text-text-secondary';
    };

    const canDrop = (col: number) => !gameOver && isMyTurn && board[0][col] === null;

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Header */}
            <div className="flex items-center justify-between w-full max-w-[290px]">
                <span className="font-heading font-bold text-lg text-text-primary">Connect Four</span>
                <button
                    onClick={onLeave}
                    className="font-mono text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded border border-red-400/30 hover:border-red-400/60"
                >
                    Leave
                </button>
            </div>

            <div className="font-mono text-xs text-text-secondary">
                You are <span className={`font-bold ${myColor === 'R' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {myColor === 'R' ? '🔴 Red' : '🟡 Yellow'}
                </span>
            </div>

            {/* Board */}
            <div className="bg-blue-900/30 border border-blue-500/20 rounded-xl p-1.5 md:p-2">
                {/* Column drop buttons */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {Array.from({ length: 7 }, (_, col) => (
                        <button
                            key={`drop-${col}`}
                            onClick={() => canDrop(col) && onDrop(col)}
                            className={`h-5 rounded-t flex items-center justify-center transition-all ${canDrop(col) ? 'hover:bg-white/10 cursor-pointer' : 'cursor-not-allowed'
                                }`}
                        >
                            {canDrop(col) && <span className="text-[10px] text-text-secondary/40">▼</span>}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {board.map((row, r) =>
                        row.map((cell, c) => (
                            <button
                                key={`${r}-${c}`}
                                onClick={() => canDrop(c) && onDrop(c)}
                                className={`w-8 h-8 md:w-9 md:h-9 rounded-full border transition-all ${cell === 'R'
                                    ? 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                                    : cell === 'Y'
                                        ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                                        : canDrop(c)
                                            ? 'bg-white/5 border-white/15 hover:bg-white/10 cursor-pointer'
                                            : 'bg-white/5 border-white/10'
                                    }`}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Status */}
            <div className={`font-mono text-sm font-semibold ${getStatusColor()}`}>
                {getStatusText()}
            </div>
        </div>
    );
}

// Check for winner in Connect Four
export function checkConnect4Winner(board: Cell[][]): 'R' | 'Y' | 'draw' | null {
    const rows = 6, cols = 7;

    // Check horizontal, vertical, diagonal
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = board[r][c];
            if (!cell) continue;

            for (const [dr, dc] of directions) {
                let count = 1;
                for (let i = 1; i < 4; i++) {
                    const nr = r + dr * i, nc = c + dc * i;
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || board[nr][nc] !== cell) break;
                    count++;
                }
                if (count >= 4) return cell;
            }
        }
    }

    // Check draw
    if (board[0].every(cell => cell !== null)) return 'draw';
    return null;
}

export function createEmptyBoard(): Cell[][] {
    return Array.from({ length: 6 }, () => Array(7).fill(null));
}

export function dropPiece(board: Cell[][], col: number, color: 'R' | 'Y'): Cell[][] | null {
    const newBoard = board.map(row => [...row]);
    for (let r = 5; r >= 0; r--) {
        if (!newBoard[r][col]) {
            newBoard[r][col] = color;
            return newBoard;
        }
    }
    return null; // Column full
}
