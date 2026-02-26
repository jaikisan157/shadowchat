import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ChevronRight, Sun, Moon } from 'lucide-react';
import type { InterestStat } from '@/types/chat';

interface HeroSectionProps {
  onStartChat: (interests: string[]) => void;
  onlineCount: number;
  isDark: boolean;
  toggleTheme: () => void;
  interestStats: InterestStat[];
}

export function HeroSection({ onStartChat, onlineCount, isDark, toggleTheme, interestStats }: HeroSectionProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const microRef = useRef<HTMLSpanElement>(null);
  const chevronsRef = useRef<HTMLDivElement>(null);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 5 ? [...prev, interest] : prev
    );
  };

  const addCustomInterest = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selectedInterests.includes(trimmed) && selectedInterests.length < 5) {
      setSelectedInterests(prev => [...prev, trimmed]);
      setCustomInput('');
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.headline-line', { opacity: 0, y: 18 });
      gsap.set(subheadRef.current, { opacity: 0, y: 14 });
      gsap.set(ctaRef.current, { opacity: 0, y: 14 });
      gsap.set(microRef.current, { opacity: 0 });
      gsap.set('.chevron-item', { opacity: 0, x: 12, scale: 0.98 });
      gsap.set('.interest-section', { opacity: 0, y: 10 });

      const tl = gsap.timeline({ delay: 0.3 });
      tl.to('.headline-line', {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out',
      })
        .to(subheadRef.current, {
          opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        }, '-=0.3')
        .to('.interest-section', {
          opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
        }, '-=0.2')
        .to(ctaRef.current, {
          opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        }, '-=0.2')
        .to(microRef.current, {
          opacity: 1, duration: 0.5,
        }, '-=0.2')
        .to('.chevron-item', {
          opacity: 1, x: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out',
        }, '-=0.4');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        onStartChat(selectedInterests);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartChat, selectedInterests]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex flex-col justify-center overflow-hidden"
      style={{ background: 'var(--dark-bg)' }}
    >
      {/* Logo */}
      <div className="absolute left-[5vw] top-[4vh]">
        <span className="font-heading font-semibold text-lg text-text-primary tracking-tight">
          ShadowChat
        </span>
      </div>

      {/* Theme Toggle */}
      <div className="absolute right-[5vw] top-[3.5vh]">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark
            ? <Sun className="w-4 h-4 text-text-secondary" />
            : <Moon className="w-4 h-4 text-text-secondary" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="pl-[5vw] pr-[5vw]">
        <div ref={headlineRef} className="mb-6 md:mb-8">
          <h1 className="font-heading font-bold uppercase tracking-tight leading-[0.95]"
            style={{ fontSize: 'clamp(44px, 6vw, 84px)' }}>
            <div className="headline-line text-text-primary">TALK</div>
            <div className="headline-line text-text-primary">TO</div>
            <div className="headline-line text-neon-cyan neon-text">STRANGERS</div>
          </h1>
        </div>

        <p
          ref={subheadRef}
          className="text-text-secondary text-sm md:text-lg max-w-md md:max-w-[34vw] mb-5 md:mb-8 leading-relaxed"
        >
          Anonymous, one-on-one, no accounts. Pick your interests to find like-minded people.
        </p>

        {/* Interest Tags */}
        <div className="interest-section mb-5 md:mb-6 max-w-lg md:max-w-[40vw]">
          <p className="font-mono text-[10px] md:text-xs text-text-secondary/60 mb-2 uppercase tracking-wider">
            Pick or type interests · optional · max 5
          </p>
          {/* Custom interest input */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); addCustomInterest(); } }}
              placeholder="Type your own..."
              maxLength={20}
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1 md:py-1.5 font-mono text-[10px] md:text-xs text-text-primary placeholder:text-text-secondary/40 focus:border-neon-cyan/50 focus:outline-none transition-colors"
            />
            {customInput.trim() && (
              <button
                onClick={addCustomInterest}
                className="px-3 py-1 rounded-full font-mono text-[10px] md:text-xs bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30 transition-colors"
              >
                Add
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {/* Show selected custom interests first */}
            {selectedInterests
              .filter(i => !interestStats.some(s => s.name === i))
              .map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full font-mono text-[10px] md:text-xs transition-all border bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 shadow-[0_0_8px_rgba(0,255,200,0.15)]"
                >
                  {interest} ✕
                </button>
              ))}
            {/* Default interests */}
            {interestStats.map(interest => {
              const isSelected = selectedInterests.includes(interest.name);
              return (
                <button
                  key={interest.name}
                  onClick={() => toggleInterest(interest.name)}
                  className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-full font-mono text-[10px] md:text-xs transition-all border ${isSelected
                    ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 shadow-[0_0_8px_rgba(0,255,200,0.15)]'
                    : 'bg-white/5 text-text-secondary border-white/10 hover:border-white/25 hover:bg-white/10'
                    }`}
                >
                  {interest.name}
                  {interest.count > 0 && (
                    <span className={`ml-1 ${isSelected ? 'text-neon-cyan/70' : 'text-text-secondary/40'}`}>
                      {interest.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <button
          ref={ctaRef}
          onClick={() => onStartChat(selectedInterests)}
          className="btn-neon bg-neon-cyan text-black font-heading font-semibold text-lg px-10 py-4 rounded-md mb-4 neon-glow hover:shadow-neon-strong transition-all"
          style={{ minWidth: '220px' }}
        >
          {selectedInterests.length > 0 ? `Start Chat (${selectedInterests.length})` : 'Start Chat'}
        </button>

        <div>
          <span ref={microRef} className="font-mono text-xs text-text-secondary/55">
            Or press Space
          </span>
        </div>
      </div>

      {/* Decorative Chevrons */}
      <div
        ref={chevronsRef}
        className="absolute right-[6vw] top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2"
      >
        <ChevronRight className="chevron-item w-8 h-8 stroke-[2]" style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
        <ChevronRight className="chevron-item w-8 h-8 stroke-[2]" style={{ color: 'var(--text-secondary)', opacity: 0.2 }} />
        <ChevronRight className="chevron-item w-8 h-8 stroke-[2]" style={{ color: 'var(--text-secondary)', opacity: 0.1 }} />
      </div>

      {/* Online Counter */}
      <div className="absolute bottom-[4vh] right-[5vw] flex items-center gap-4">
        {onlineCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            <span className="font-mono text-xs text-neon-cyan">
              {onlineCount.toLocaleString()} online
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="font-mono text-xs text-text-secondary">
            Live server connected
          </span>
        </div>
      </div>
    </div>
  );
}
