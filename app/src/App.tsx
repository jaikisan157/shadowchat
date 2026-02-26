import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroSection } from '@/sections/HeroSection';
import { ChatSection } from '@/sections/ChatSection';
import { useWebSocket } from '@/hooks/useWebSocket';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [showChat, setShowChat] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('shadowchat_theme') !== 'light';
  });
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const {
    connected,
    chatState,
    findMatch,
    sendMessage,
    sendTyping,
    sendReaction,
    stopChat,
    newChat
  } = useWebSocket();

  // Apply theme to html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('shadowchat_theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('shadowchat_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(d => !d), []);

  // Handle start chat from hero
  const handleStartChat = useCallback(() => {
    setShowChat(true);
    // Start searching immediately
    setTimeout(() => {
      findMatch();
    }, 500);
  }, [findMatch]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    newChat();
  }, [newChat]);

  // Scroll animation setup
  useEffect(() => {
    if (!showChat) return;

    const ctx = gsap.context(() => {
      // Hero exit animation
      gsap.to(heroRef.current, {
        yPercent: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
      });

      // Chat entrance animation
      gsap.fromTo(chatRef.current,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.2 }
      );
    }, mainRef);

    return () => ctx.revert();
  }, [showChat]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to stop chat (only when in chat view and matched)
      if (e.key === 'Escape' && showChat && chatState.status === 'matched') {
        stopChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatState.status, stopChat, showChat]);

  return (
    <div ref={mainRef} className="relative min-h-screen" style={{ background: 'var(--dark-bg)' }}>
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Vignette */}
      <div className="vignette" />

      {/* Hero Section - has theme toggle built in */}
      <div
        ref={heroRef}
        className={`${showChat ? 'absolute inset-0 z-10' : 'relative z-20'}`}
      >
        <HeroSection
          onStartChat={handleStartChat}
          onlineCount={chatState.onlineCount}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      </div>

      {/* Chat Section */}
      {showChat && (
        <div
          ref={chatRef}
          className="fixed inset-0 z-30"
        >
          <ChatSection
            chatState={chatState}
            onSendMessage={sendMessage}
            onSendTyping={sendTyping}
            onSendReaction={sendReaction}
            onStopChat={stopChat}
            onNewChat={handleNewChat}
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        </div>
      )}

      {/* Connection Status Toast */}
      {!connected && showChat && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-dark-bubble border border-red-500/30 text-red-400 px-4 py-2 rounded-md flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm">Reconnecting to server...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
