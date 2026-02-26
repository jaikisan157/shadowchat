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
    position?: 'above' | 'below';
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    const [showFull, setShowFull] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [pickerStyle, setPickerStyle] = useState<React.CSSProperties>({});

    // Position picker to stay on screen
    useEffect(() => {
        if (pickerRef.current) {
            const rect = pickerRef.current.getBoundingClientRect();
            const style: React.CSSProperties = {};

            // Keep within horizontal bounds
            if (rect.right > window.innerWidth) {
                style.transform = `translateX(-${rect.right - window.innerWidth + 8}px)`;
            }
            if (rect.left < 0) {
                style.transform = `translateX(${-rect.left + 8}px)`;
            }

            // If above goes off top, show below
            if (rect.top < 0) {
                style.top = '100%';
                style.bottom = 'auto';
                style.marginTop = '8px';
            }

            setPickerStyle(style);
        }
    }, [showFull]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    // Filter emojis by search (match category name)
    const filteredCategories = searchQuery
        ? EMOJI_CATEGORIES.map(cat => ({
            ...cat,
            emojis: cat.emojis.filter(() =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        })).filter(cat => cat.emojis.length > 0)
        : EMOJI_CATEGORIES;

    return (
        <div ref={pickerRef} className="absolute bottom-full mb-2 left-0 z-50" style={pickerStyle}>
            {/* Quick Reactions */}
            {!showFull && (
                <div className="flex items-center gap-1 bg-dark-card border border-white/10 rounded-full px-2 py-1.5 shadow-lg animate-fade-in-up">
                    {QUICK_REACTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleSelect(emoji)}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform rounded-full hover:bg-white/10"
                        >
                            {emoji}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowFull(true)}
                        className="w-8 h-8 flex items-center justify-center text-xs text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-full transition-colors font-bold"
                    >
                        +
                    </button>
                </div>
            )}

            {/* Full Emoji Picker */}
            {showFull && (
                <div className="w-[min(18rem,calc(100vw-2rem))] max-h-72 bg-dark-card border border-white/10 rounded-lg shadow-xl overflow-hidden animate-fade-in-up">
                    {/* Search Bar */}
                    <div className="p-2 border-b border-white/10">
                        <div className="flex items-center gap-2 bg-dark-input rounded-md px-2 py-1.5">
                            <Search className="w-3.5 h-3.5 text-text-secondary shrink-0" />
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
                                    <X className="w-3.5 h-3.5 text-text-secondary hover:text-text-primary" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Emoji Grid */}
                    <div className="overflow-y-auto max-h-52 p-2">
                        {filteredCategories.map((category) => (
                            <div key={category.name} className="mb-3">
                                <span className="font-mono text-[10px] text-text-secondary/60 uppercase tracking-wider px-1">
                                    {category.name}
                                </span>
                                <div className="grid grid-cols-7 gap-0.5 mt-1">
                                    {category.emojis.map((emoji, i) => (
                                        <button
                                            key={`${emoji}-${i}`}
                                            onClick={() => handleSelect(emoji)}
                                            className="w-8 h-8 flex items-center justify-center text-lg hover:scale-110 transition-transform rounded hover:bg-white/10"
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
    );
}

export { QUICK_REACTIONS };
