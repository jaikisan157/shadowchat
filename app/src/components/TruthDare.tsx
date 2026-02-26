interface TruthDareProps {
    onSendPrompt: (prompt: string) => void;
    onLeave: () => void;
    prompts: { text: string; from: 'me' | 'them'; type: 'truth' | 'dare' }[];
}

const TRUTHS = [
    "What's your most embarrassing moment?",
    "What's a secret you've never told anyone online?",
    "What's the last lie you told?",
    "What's your biggest fear?",
    "What's the most childish thing you still do?",
    "Have you ever stalked someone on social media?",
    "What's your guilty pleasure?",
    "What's the weirdest dream you've ever had?",
    "What's something you pretend to hate but secretly love?",
    "If you could read minds, whose would you read first?",
    "What's the most embarrassing thing in your search history?",
    "What's your most unpopular opinion?",
    "What's the cringiest thing you've done for a crush?",
    "What's a skill you wish you had?",
    "What's the longest you've gone without showering?",
];

const DARES = [
    "Send the 5th photo in your gallery",
    "Type the next 3 messages with your eyes closed",
    "Use only emojis for the next 2 minutes",
    "Say something nice about a stranger",
    "Share your most used emoji 🔥",
    "Type a message using only your nose",
    "Describe yourself in 3 emojis",
    "Share the last song you listened to",
    "Make up a short poem right now",
    "Send a voice message singing something (if you dare!)",
    "Don't use the letter 'e' in your next 5 messages",
    "Speak in a different language for the next minute",
    "Share your most controversial food take",
    "Describe your outfit right now",
    "Tell a joke that will make the other person laugh",
];

export function TruthDare({ onSendPrompt, onLeave, prompts }: TruthDareProps) {
    const getRandomPrompt = (type: 'truth' | 'dare') => {
        const list = type === 'truth' ? TRUTHS : DARES;
        const prompt = list[Math.floor(Math.random() * list.length)];
        onSendPrompt(`${type === 'truth' ? '🔮 Truth' : '🔥 Dare'}: ${prompt}`);
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between w-full">
                <span className="font-heading font-bold text-lg text-text-primary">Truth or Dare</span>
                <button
                    onClick={onLeave}
                    className="font-mono text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded border border-red-400/30 hover:border-red-400/60"
                >
                    Leave
                </button>
            </div>

            {/* Prompt history */}
            <div className="w-full max-h-[200px] overflow-y-auto flex flex-col gap-2 mb-2">
                {prompts.length === 0 && (
                    <p className="font-mono text-xs text-text-secondary/50 text-center py-4">
                        Pick Truth or Dare to start!
                    </p>
                )}
                {prompts.map((p, i) => (
                    <div key={i} className={`px-3 py-2 rounded-lg font-mono text-xs ${p.from === 'me'
                            ? 'bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan ml-4'
                            : 'bg-white/5 border border-white/10 text-text-primary mr-4'
                        }`}>
                        <span className="text-[10px] text-text-secondary/50 block mb-0.5">
                            {p.from === 'me' ? 'You asked' : 'They asked'}
                        </span>
                        {p.text}
                    </div>
                ))}
            </div>

            {/* Pick buttons */}
            <div className="flex gap-3 w-full">
                <button
                    onClick={() => getRandomPrompt('truth')}
                    className="flex-1 py-3 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-all font-mono text-sm text-blue-400 font-bold"
                >
                    🔮 Truth
                </button>
                <button
                    onClick={() => getRandomPrompt('dare')}
                    className="flex-1 py-3 rounded-lg border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-all font-mono text-sm text-orange-400 font-bold"
                >
                    🔥 Dare
                </button>
            </div>

            <p className="font-mono text-[10px] text-text-secondary/40">
                Both players can pick prompts
            </p>
        </div>
    );
}
