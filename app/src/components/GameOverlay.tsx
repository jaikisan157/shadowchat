import { useState, useEffect, useCallback, useRef } from 'react';
import { Gamepad2 } from 'lucide-react';
import { TicTacToe, checkWinner } from './TicTacToe';
import { RockPaperScissors, getRPSResult } from './RockPaperScissors';
import type { WebSocketMessage, GameType } from '@/types/chat';

type Cell = 'X' | 'O' | null;

interface GameOverlayProps {
    sendGameMessage: (type: string, game: string, data?: unknown) => void;
    setGameHandler: (handler: ((msg: WebSocketMessage) => void) | null) => void;
    isMatched: boolean;
    onPartnerDisconnect: boolean;
}

type GameState =
    | { phase: 'idle' }
    | { phase: 'menu' }
    | { phase: 'invite_sent'; game: GameType }
    | { phase: 'invite_received'; game: GameType }
    | { phase: 'playing'; game: GameType };

const GAME_NAMES: Record<GameType, string> = {
    tictactoe: 'Tic-Tac-Toe',
    rps: 'Rock Paper Scissors',
};

export function GameOverlay({ sendGameMessage, setGameHandler, isMatched, onPartnerDisconnect }: GameOverlayProps) {
    const [gameState, setGameState] = useState<GameState>({ phase: 'idle' });

    // TTT state
    const [tttBoard, setTttBoard] = useState<Cell[]>(Array(9).fill(null));
    const [tttMySymbol, setTttMySymbol] = useState<'X' | 'O'>('X');
    const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
    const [tttWinner, setTttWinner] = useState<'X' | 'O' | 'draw' | null>(null);

    // RPS state
    const [rpsMyChoice, setRpsMyChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
    const [rpsOppChoice, setRpsOppChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null);
    const [rpsResult, setRpsResult] = useState<'win' | 'lose' | 'draw' | null>(null);
    const [rpsRound, setRpsRound] = useState(1);
    const [rpsScore, setRpsScore] = useState({ me: 0, them: 0 });
    const rpsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset on disconnect
    useEffect(() => {
        if (onPartnerDisconnect || !isMatched) {
            setGameState({ phase: 'idle' });
            resetTTT();
            resetRPS();
        }
    }, [onPartnerDisconnect, isMatched]);

    const resetTTT = () => {
        setTttBoard(Array(9).fill(null));
        setTttMySymbol('X');
        setTttTurn('X');
        setTttWinner(null);
    };

    const resetRPS = () => {
        setRpsMyChoice(null);
        setRpsOppChoice(null);
        setRpsResult(null);
        setRpsRound(1);
        setRpsScore({ me: 0, them: 0 });
        if (rpsTimerRef.current) clearTimeout(rpsTimerRef.current);
    };

    // Handle incoming game messages
    const handleGameMessage = useCallback((msg: WebSocketMessage) => {
        const m = msg as { type: string; game: string; data?: unknown };

        switch (m.type) {
            case 'game_invite':
                if (gameState.phase === 'idle' || gameState.phase === 'menu') {
                    setGameState({ phase: 'invite_received', game: m.game as GameType });
                }
                break;

            case 'game_accept':
                if (gameState.phase === 'invite_sent') {
                    // I invited, they accepted — I'm X (go first) in TTT, or just start RPS
                    if (m.game === 'tictactoe') {
                        resetTTT();
                        setTttMySymbol('X');
                        setTttTurn('X');
                    } else {
                        resetRPS();
                    }
                    setGameState({ phase: 'playing', game: m.game as GameType });
                }
                break;

            case 'game_decline':
                setGameState({ phase: 'idle' });
                break;

            case 'game_move':
                if (gameState.phase === 'playing') {
                    const data = m.data as Record<string, unknown>;
                    if (m.game === 'tictactoe') {
                        const index = data.index as number;
                        const symbol = data.symbol as 'X' | 'O';
                        setTttBoard(prev => {
                            const next = [...prev];
                            next[index] = symbol;
                            const w = checkWinner(next);
                            if (w) setTttWinner(w);
                            return next;
                        });
                        setTttTurn(prev => prev === 'X' ? 'O' : 'X');
                    } else if (m.game === 'rps') {
                        const choice = data.choice as 'rock' | 'paper' | 'scissors';
                        setRpsOppChoice(choice);
                    }
                }
                break;

            case 'game_leave':
                setGameState({ phase: 'idle' });
                resetTTT();
                resetRPS();
                break;
        }
    }, [gameState.phase]);

    // Register/deregister game handler
    useEffect(() => {
        setGameHandler(handleGameMessage);
        return () => setGameHandler(null);
    }, [handleGameMessage, setGameHandler]);

    // RPS: Check result when both have chosen
    useEffect(() => {
        if (rpsMyChoice && rpsOppChoice && !rpsResult) {
            const result = getRPSResult(rpsMyChoice, rpsOppChoice);
            setRpsResult(result);

            const newScore = { ...rpsScore };
            if (result === 'win') newScore.me++;
            if (result === 'lose') newScore.them++;
            setRpsScore(newScore);

            // Check if best of 3 is over
            if (newScore.me >= 2 || newScore.them >= 2) {
                // Game over — close after 3s
                rpsTimerRef.current = setTimeout(() => {
                    setGameState({ phase: 'idle' });
                    resetRPS();
                }, 3000);
            } else {
                // Next round after 2s
                rpsTimerRef.current = setTimeout(() => {
                    setRpsMyChoice(null);
                    setRpsOppChoice(null);
                    setRpsResult(null);
                    setRpsRound(r => r + 1);
                }, 2000);
            }
        }
    }, [rpsMyChoice, rpsOppChoice, rpsResult, rpsScore]);

    // Actions
    const openMenu = () => setGameState({ phase: 'menu' });

    const sendInvite = (game: GameType) => {
        sendGameMessage('game_invite', game);
        setGameState({ phase: 'invite_sent', game });
    };

    const acceptInvite = () => {
        if (gameState.phase !== 'invite_received') return;
        const game = gameState.game;
        sendGameMessage('game_accept', game);
        // They invited — they're X (go first) in TTT, I'm O
        if (game === 'tictactoe') {
            resetTTT();
            setTttMySymbol('O');
            setTttTurn('X');
        } else {
            resetRPS();
        }
        setGameState({ phase: 'playing', game });
    };

    const declineInvite = () => {
        if (gameState.phase !== 'invite_received') return;
        sendGameMessage('game_decline', gameState.game);
        setGameState({ phase: 'idle' });
    };

    const leaveGame = () => {
        if (gameState.phase === 'playing') {
            sendGameMessage('game_leave', gameState.game);
        }
        setGameState({ phase: 'idle' });
        resetTTT();
        resetRPS();
    };

    const handleTTTMove = (index: number) => {
        if (tttBoard[index] || tttWinner) return;
        const newBoard = [...tttBoard];
        newBoard[index] = tttMySymbol;
        setTttBoard(newBoard);
        setTttTurn(tttMySymbol === 'X' ? 'O' : 'X');
        sendGameMessage('game_move', 'tictactoe', { index, symbol: tttMySymbol });
        const w = checkWinner(newBoard);
        if (w) setTttWinner(w);
    };

    const handleRPSChoice = (choice: 'rock' | 'paper' | 'scissors') => {
        setRpsMyChoice(choice);
        sendGameMessage('game_move', 'rps', { choice });
    };

    // Don't render anything if not matched
    if (!isMatched) return null;

    // Game button (always visible when idle)
    if (gameState.phase === 'idle') {
        return (
            <button
                onClick={openMenu}
                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-md text-text-secondary/50 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all shrink-0"
                title="Play a game"
            >
                <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
        );
    }

    // Game menu
    if (gameState.phase === 'menu') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setGameState({ phase: 'idle' })}>
                <div className="bg-dark-card border border-white/10 rounded-xl p-5 max-w-[min(20rem,90vw)] shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                    <p className="font-heading font-semibold text-text-primary text-base mb-4 flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-neon-cyan" /> Play a Game
                    </p>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => sendInvite('tictactoe')}
                            className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all text-left"
                        >
                            <div className="font-mono text-sm text-text-primary">❌⭕ Tic-Tac-Toe</div>
                            <div className="font-mono text-[10px] text-text-secondary/50 mt-0.5">Classic 3x3 grid</div>
                        </button>
                        <button
                            onClick={() => sendInvite('rps')}
                            className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-neon-cyan/10 hover:border-neon-cyan/30 transition-all text-left"
                        >
                            <div className="font-mono text-sm text-text-primary">🪨📄✂️ Rock Paper Scissors</div>
                            <div className="font-mono text-[10px] text-text-secondary/50 mt-0.5">Best of 3</div>
                        </button>
                    </div>
                    <button onClick={() => setGameState({ phase: 'idle' })} className="mt-3 w-full font-mono text-xs text-text-secondary/60 hover:text-text-secondary transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // Invite sent — waiting
    if (gameState.phase === 'invite_sent') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                <div className="bg-dark-card border border-white/10 rounded-xl p-5 max-w-[min(18rem,90vw)] shadow-2xl animate-fade-in-up text-center">
                    <div className="flex justify-center gap-1 mb-3">
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="font-mono text-sm text-text-primary mb-1">
                        Invited stranger to play
                    </p>
                    <p className="font-mono text-xs text-neon-cyan mb-4">
                        {GAME_NAMES[gameState.game]}
                    </p>
                    <button
                        onClick={() => { sendGameMessage('game_decline', gameState.game); setGameState({ phase: 'idle' }); }}
                        className="font-mono text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    // Invite received
    if (gameState.phase === 'invite_received') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                <div className="bg-dark-card border border-white/10 rounded-xl p-5 max-w-[min(18rem,90vw)] shadow-2xl animate-fade-in-up text-center">
                    <Gamepad2 className="w-8 h-8 text-neon-cyan mx-auto mb-3" />
                    <p className="font-mono text-sm text-text-primary mb-1">
                        Stranger wants to play
                    </p>
                    <p className="font-mono text-xs text-neon-cyan mb-4">
                        {GAME_NAMES[gameState.game]}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={declineInvite}
                            className="px-5 py-2 rounded-lg border border-white/15 bg-white/5 font-mono text-sm text-text-secondary hover:bg-white/10 transition-all"
                        >
                            Decline
                        </button>
                        <button
                            onClick={acceptInvite}
                            className="px-5 py-2 rounded-lg bg-neon-cyan text-black font-mono text-sm font-bold hover:bg-neon-cyan/90 transition-all"
                        >
                            Play!
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Playing
    if (gameState.phase === 'playing') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="bg-dark-card border border-white/10 rounded-xl p-5 shadow-2xl animate-fade-in-up">
                    {gameState.game === 'tictactoe' && (
                        <TicTacToe
                            isMyTurn={tttTurn === tttMySymbol}
                            mySymbol={tttMySymbol}
                            onMove={handleTTTMove}
                            onLeave={leaveGame}
                            board={tttBoard}
                            winner={tttWinner}
                            gameOver={!!tttWinner}
                        />
                    )}
                    {gameState.game === 'rps' && (
                        <RockPaperScissors
                            myChoice={rpsMyChoice}
                            opponentChoice={rpsResult ? rpsOppChoice : null}
                            onChoice={handleRPSChoice}
                            onLeave={leaveGame}
                            result={rpsResult}
                            round={rpsRound}
                            score={rpsScore}
                        />
                    )}
                </div>
            </div>
        );
    }

    return null;
}
