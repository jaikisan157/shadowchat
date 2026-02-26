import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ChevronRight, Sun, Moon } from 'lucide-react';

interface HeroSectionProps {
  onStartChat: () => void;
  onlineCount: number;
  isDark: boolean;
  toggleTheme: () => void;
}

export function HeroSection({ onStartChat, onlineCount, isDark, toggleTheme }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const microRef = useRef<HTMLSpanElement>(null);
  const chevronsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set('.headline-line', { opacity: 0, y: 18 });
      gsap.set(subheadRef.current, { opacity: 0, y: 14 });
      gsap.set(ctaRef.current, { opacity: 0, y: 14 });
      gsap.set(microRef.current, { opacity: 0 });
      gsap.set('.chevron-item', { opacity: 0, x: 12, scale: 0.98 });

      // Animation timeline
      const tl = gsap.timeline({ delay: 0.3 });

      tl.to('.headline-line', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
      })
        .to(subheadRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        }, '-=0.2')
        .to(ctaRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
        }, '-=0.3')
        .to(microRef.current, {
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
        }, '-=0.2')
        .to('.chevron-item', {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
        }, '-=0.4');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Handle space key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        onStartChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartChat]);

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

      {/* Theme Toggle in nav */}
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
        {/* Headline */}
        <div ref={headlineRef} className="mb-8">
          <h1 className="font-heading font-bold uppercase tracking-tight leading-[0.95]"
            style={{ fontSize: 'clamp(44px, 6vw, 84px)' }}>
            <div className="headline-line text-text-primary">TALK</div>
            <div className="headline-line text-text-primary">TO</div>
            <div className="headline-line text-neon-cyan neon-text">STRANGERS</div>
          </h1>
        </div>

        {/* Subheadline */}
        <p
          ref={subheadRef}
          className="text-text-secondary text-base md:text-lg max-w-[34vw] mb-8 leading-relaxed"
        >
          Anonymous, one-on-one, no accounts. Just click and start talking to someone new.
        </p>

        {/* CTA Button */}
        <button
          ref={ctaRef}
          onClick={onStartChat}
          className="btn-neon bg-neon-cyan text-black font-heading font-semibold text-lg px-10 py-4 rounded-md mb-4 neon-glow hover:shadow-neon-strong transition-all"
          style={{ minWidth: '220px' }}
        >
          Start Chat
        </button>

        {/* Micro Text */}
        <div>
          <span
            ref={microRef}
            className="font-mono text-xs text-text-secondary/55"
          >
            Or press Space
          </span>
        </div>
      </div>

      {/* Decorative Chevrons */}
      <div
        ref={chevronsRef}
        className="absolute right-[6vw] top-1/2 -translate-y-1/2 flex flex-col gap-2"
      >
        <ChevronRight className="chevron-item w-8 h-8 stroke-[2]" style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
        <ChevronRight className="chevron-item w-8 h-8 stroke-[2]" style={{ color: 'var(--text-secondary)', opacity: 0.2 }} />
        <ChevronRight className="chevron-item w-8 h-8 stroke-[2]" style={{ color: 'var(--text-secondary)', opacity: 0.1 }} />
      </div>

      {/* Connection Status & Online Counter */}
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
