// Sound effects using Web Audio API - no files needed
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    // Resume if suspended (browsers require user interaction first)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    startDelay: number = 0
) {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);

        // Fade in and out for smooth sound
        gainNode.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + startDelay + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime + startDelay);
        oscillator.stop(ctx.currentTime + startDelay + duration);
    } catch {
        // Audio not supported, silently fail
    }
}

// Match found - ascending two-note chime
export function playMatchSound() {
    playTone(523, 0.15, 'sine', 0.25, 0);      // C5
    playTone(659, 0.15, 'sine', 0.25, 0.12);    // E5
    playTone(784, 0.25, 'sine', 0.2, 0.24);     // G5
}

// Message received - short subtle blip
export function playMessageSound() {
    playTone(880, 0.08, 'sine', 0.15, 0);       // A5 - quick blip
    playTone(1047, 0.1, 'sine', 0.1, 0.06);     // C6 - soft follow
}

// Disconnect - descending tone
export function playDisconnectSound() {
    playTone(440, 0.15, 'sine', 0.2, 0);        // A4
    playTone(330, 0.2, 'sine', 0.15, 0.12);     // E4
    playTone(262, 0.3, 'sine', 0.1, 0.28);      // C4 - low end
}
