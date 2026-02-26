type RPSChoice = 'rock' | 'paper' | 'scissors' | null;

interface RPSProps {
    myChoice: RPSChoice;
    opponentChoice: RPSChoice;
    onChoice: (choice: 'rock' | 'paper' | 'scissors') => void;
    onLeave: () => void;
    result: 'win' | 'lose' | 'draw' | null;
    round: number;
    score: { me: number; them: number };
}

const EMOJIS: Record<string, string> = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️',
};

export function RockPaperScissors({ myChoice, opponentChoice, onChoice, onLeave, result, round, score }: RPSProps) {
    const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];

    const getResultText = () => {
        if (!result) return myChoice ? 'Waiting for stranger...' : 'Pick your move!';
        if (result === 'draw') return "It's a draw!";
        if (result === 'win') return '🎉 You won this round!';
        return 'You lost this round!';
    };

    const getResultColor = () => {
        if (!result) return myChoice ? 'text-yellow-400' : 'text-neon-cyan';
        if (result === 'win') return 'text-neon-green';
        if (result === 'lose') return 'text-red-400';
        return 'text-yellow-400';
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Header */}
            <div className="flex items-center justify-between w-full max-w-[300px]">
                <span className="font-heading font-bold text-lg text-text-primary">Rock Paper Scissors</span>
                <button
                    onClick={onLeave}
                    className="font-mono text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded border border-red-400/30 hover:border-red-400/60"
                >
                    Leave
                </button>
            </div>

            {/* Score */}
            <div className="flex items-center gap-6 font-mono text-sm">
                <div className="text-center">
                    <div className="text-neon-cyan font-bold text-xl">{score.me}</div>
                    <div className="text-text-secondary/60 text-[10px]">YOU</div>
                </div>
                <div className="text-text-secondary/40 text-xs">Round {round}</div>
                <div className="text-center">
                    <div className="text-red-400 font-bold text-xl">{score.them}</div>
                    <div className="text-text-secondary/60 text-[10px]">THEM</div>
                </div>
            </div>

            {/* Choices reveal */}
            {result && (
                <div className="flex items-center gap-8 my-2">
                    <div className="text-center">
                        <div className="text-4xl mb-1">{myChoice ? EMOJIS[myChoice] : '❓'}</div>
                        <div className="font-mono text-[10px] text-text-secondary">You</div>
                    </div>
                    <div className="font-mono text-text-secondary text-lg">vs</div>
                    <div className="text-center">
                        <div className="text-4xl mb-1">{opponentChoice ? EMOJIS[opponentChoice] : '❓'}</div>
                        <div className="font-mono text-[10px] text-text-secondary">Them</div>
                    </div>
                </div>
            )}

            {/* Pick buttons */}
            {!myChoice && (
                <div className="flex gap-4 my-2">
                    {choices.map(choice => (
                        <button
                            key={choice}
                            onClick={() => onChoice(choice)}
                            className="w-20 h-20 md:w-24 md:h-24 rounded-xl border border-white/15 bg-white/5 hover:bg-neon-cyan/10 hover:border-neon-cyan/40 transition-all flex flex-col items-center justify-center gap-1 active:scale-95"
                        >
                            <span className="text-3xl">{EMOJIS[choice]}</span>
                            <span className="font-mono text-[9px] text-text-secondary capitalize">{choice}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Waiting indicator */}
            {myChoice && !result && (
                <div className="flex items-center gap-3 my-4">
                    <div className="text-4xl">{EMOJIS[myChoice]}</div>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}

            {/* Result */}
            <div className={`font-mono text-sm font-semibold ${getResultColor()}`}>
                {getResultText()}
            </div>

            {/* Best of 3 info */}
            <div className="font-mono text-[10px] text-text-secondary/40">
                Best of 3
            </div>
        </div>
    );
}

// RPS logic
export function getRPSResult(mine: string, theirs: string): 'win' | 'lose' | 'draw' {
    if (mine === theirs) return 'draw';
    if (
        (mine === 'rock' && theirs === 'scissors') ||
        (mine === 'paper' && theirs === 'rock') ||
        (mine === 'scissors' && theirs === 'paper')
    ) return 'win';
    return 'lose';
}
