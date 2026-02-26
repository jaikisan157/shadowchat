import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const QUICK_REACTIONS = ['👍', '😂', '❤️', '🔥', '😮'];

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
    {
        name: 'Smileys',
        emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '🤐', '😯', '😲', '😳', '🥺', '😢', '😭', '😤', '😠', '🤬', '😈', '💀', '☠️', '🤡', '👻', '👽']
    },
    {
        name: 'Gestures',
        emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '👌', '🤏', '🙏', '💪', '🫶']
    },
    {
        name: 'Hearts',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💔', '❣️', '🫀']
    },
    {
        name: 'Objects',
        emojis: ['🔥', '⭐', '🌟', '✨', '💫', '🎉', '🎊', '🎈', '💯', '💢', '💥', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '🎵', '🎶', '🔔', '📢', '🏆', '🥇']
    },
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    const [showFull, setShowFull] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Use setTimeout to avoid closing immediately on the same click that opened it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [onClose]);

    // Focus search when full picker opens
    useEffect(() => {
        if (showFull && searchRef.current) {
            searchRef.current.focus();
        }
    }, [showFull]);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        onClose();
    };

    const filteredCategories = searchQuery
        ? EMOJI_CATEGORIES.map(cat => ({
            ...cat,
            emojis: cat.emojis.filter(() =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter(cat => cat.emojis.length > 0)
        : EMOJI_CATEGORIES;

    return (
        // Fixed overlay - always centered on screen
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
            <div ref={pickerRef} onClick={(e) => e.stopPropagation()}>
                {/* Quick Reactions */}
                {!showFull && (
                    <div className="flex items-center gap-1.5 bg-dark-card border border-white/10 rounded-full px-3 py-2 shadow-2xl animate-fade-in-up">
                        {QUICK_REACTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleSelect(emoji)}
                                className="w-10 h-10 flex items-center justify-center text-xl hover:scale-125 active:scale-95 transition-transform rounded-full hover:bg-white/10"
                            >
                                {emoji}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowFull(true)}
                            className="w-10 h-10 flex items-center justify-center text-lg text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-full transition-colors font-bold"
                        >
                            +
                        </button>
                    </div>
                )}

                {/* Full Emoji Picker */}
                {showFull && (
                    <div className="w-[min(20rem,calc(100vw-2rem))] max-h-[60vh] bg-dark-card border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                        {/* Search Bar */}
                        <div className="p-3 border-b border-white/10">
                            <div className="flex items-center gap-2 bg-dark-input rounded-lg px-3 py-2">
                                <Search className="w-4 h-4 text-text-secondary shrink-0" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search emojis..."
                                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 outline-none"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')}>
                                        <X className="w-4 h-4 text-text-secondary hover:text-text-primary" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Emoji Grid */}
                        <div className="overflow-y-auto max-h-[45vh] p-3">
                            {filteredCategories.map((category) => (
                                <div key={category.name} className="mb-4">
                                    <span className="font-mono text-[10px] text-text-secondary/60 uppercase tracking-wider px-1">
                                        {category.name}
                                    </span>
                                    <div className="grid grid-cols-7 gap-1 mt-1.5">
                                        {category.emojis.map((emoji, i) => (
                                            <button
                                                key={`${emoji}-${i}`}
                                                onClick={() => handleSelect(emoji)}
                                                className="w-9 h-9 flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-transform rounded-lg hover:bg-white/10"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export { QUICK_REACTIONS };
