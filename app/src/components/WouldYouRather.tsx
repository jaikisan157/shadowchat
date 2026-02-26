interface WYRProps {
    onAnswer: (choice: 'A' | 'B') => void;
    onNext: () => void;
    onLeave: () => void;
    question: { a: string; b: string } | null;
    myAnswer: 'A' | 'B' | null;
    theirAnswer: 'A' | 'B' | null;
    round: number;
}

const QUESTIONS = [
    { a: "Be able to fly", b: "Be able to read minds" },
    { a: "Live in the past", b: "Live in the future" },
    { a: "Have unlimited money", b: "Have unlimited time" },
    { a: "Never use social media again", b: "Never watch movies again" },
    { a: "Be famous", b: "Be rich" },
    { a: "Always be cold", b: "Always be hot" },
    { a: "Have no internet", b: "Have no phone" },
    { a: "Live alone on an island", b: "Live in a crowded city forever" },
    { a: "Know how you die", b: "Know when you die" },
    { a: "Be invisible", b: "Be able to teleport" },
    { a: "Have free WiFi everywhere", b: "Have free food everywhere" },
    { a: "Speak every language", b: "Play every instrument" },
    { a: "Never sleep", b: "Never eat" },
    { a: "Live without music", b: "Live without TV" },
    { a: "Be a genius with no friends", b: "Be average with many friends" },
    { a: "Have a rewind button for life", b: "Have a pause button for life" },
    { a: "Be stuck in a horror movie", b: "Be stuck in a rom-com" },
    { a: "Give up gaming forever", b: "Give up Netflix forever" },
    { a: "Always say what's on your mind", b: "Never speak again" },
    { a: "Be 4 feet tall", b: "Be 8 feet tall" },
];

export function getRandomWYR(): { a: string; b: string } {
    return QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
}

export function WouldYouRather({ onAnswer, onNext, onLeave, question, myAnswer, theirAnswer, round }: WYRProps) {
    const bothAnswered = myAnswer && theirAnswer;
    const sameAnswer = bothAnswered && myAnswer === theirAnswer;

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between w-full">
                <span className="font-heading font-bold text-lg text-text-primary">Would You Rather</span>
                <button
                    onClick={onLeave}
                    className="font-mono text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded border border-red-400/30 hover:border-red-400/60"
                >
                    Leave
                </button>
            </div>

            <div className="font-mono text-xs text-text-secondary/50">Round {round}</div>

            {question && (
                <>
                    {/* Option A */}
                    <button
                        onClick={() => !myAnswer && onAnswer('A')}
                        disabled={!!myAnswer}
                        className={`w-full py-4 px-4 rounded-lg border transition-all font-mono text-sm text-center ${myAnswer === 'A'
                                ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan'
                                : bothAnswered && theirAnswer === 'A'
                                    ? 'bg-red-400/10 border-red-400/30 text-red-400'
                                    : 'bg-white/5 border-white/10 text-text-primary hover:bg-white/10 hover:border-white/20'
                            } ${!myAnswer ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                        {question.a}
                        {bothAnswered && (
                            <div className="mt-1 text-[10px] text-text-secondary/50">
                                {myAnswer === 'A' && '← You'}
                                {theirAnswer === 'A' && (myAnswer === 'A' ? ' & Them' : '← Them')}
                            </div>
                        )}
                    </button>

                    <div className="font-mono text-xs text-text-secondary/30">OR</div>

                    {/* Option B */}
                    <button
                        onClick={() => !myAnswer && onAnswer('B')}
                        disabled={!!myAnswer}
                        className={`w-full py-4 px-4 rounded-lg border transition-all font-mono text-sm text-center ${myAnswer === 'B'
                                ? 'bg-neon-cyan/15 border-neon-cyan/50 text-neon-cyan'
                                : bothAnswered && theirAnswer === 'B'
                                    ? 'bg-red-400/10 border-red-400/30 text-red-400'
                                    : 'bg-white/5 border-white/10 text-text-primary hover:bg-white/10 hover:border-white/20'
                            } ${!myAnswer ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                        {question.b}
                        {bothAnswered && (
                            <div className="mt-1 text-[10px] text-text-secondary/50">
                                {myAnswer === 'B' && '← You'}
                                {theirAnswer === 'B' && (myAnswer === 'B' ? ' & Them' : '← Them')}
                            </div>
                        )}
                    </button>

                    {/* Status */}
                    {myAnswer && !theirAnswer && (
                        <div className="font-mono text-xs text-yellow-400 flex items-center gap-2">
                            Waiting for stranger...
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}

                    {bothAnswered && (
                        <div className="flex flex-col items-center gap-2">
                            <div className={`font-mono text-sm font-bold ${sameAnswer ? 'text-neon-green' : 'text-red-400'}`}>
                                {sameAnswer ? '🎉 You think alike!' : '🤷 Different minds!'}
                            </div>
                            <button
                                onClick={onNext}
                                className="px-5 py-2 rounded-lg bg-neon-cyan text-black font-mono text-sm font-bold hover:bg-neon-cyan/90 transition-all"
                            >
                                Next Question
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
