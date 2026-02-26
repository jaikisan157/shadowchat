import { useState, useEffect, useRef } from 'react';

type SignalStrength = 'good' | 'mid' | 'poor' | 'offline';

interface NetworkIndicatorProps {
    wsConnected: boolean;
}

export function NetworkIndicator({ wsConnected }: NetworkIndicatorProps) {
    const [strength, setStrength] = useState<SignalStrength>('good');
    const pingTimesRef = useRef<number[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!wsConnected) {
            setStrength('offline');
            return;
        }

        // Use Navigator.connection API if available
        const updateFromNetworkInfo = () => {
            const conn = (navigator as any).connection;
            if (conn) {
                const type = conn.effectiveType;
                if (type === 'slow-2g' || type === '2g') {
                    setStrength('poor');
                } else if (type === '3g') {
                    setStrength('mid');
                } else {
                    setStrength('good');
                }
                return true;
            }
            return false;
        };

        // Try network info API
        const hasAPI = updateFromNetworkInfo();

        if (hasAPI) {
            const conn = (navigator as any).connection;
            conn?.addEventListener('change', updateFromNetworkInfo);
            return () => conn?.removeEventListener('change', updateFromNetworkInfo);
        }

        // Fallback: use periodic fetch latency check
        const checkLatency = async () => {
            try {
                const start = performance.now();
                await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
                const latency = performance.now() - start;

                pingTimesRef.current.push(latency);
                if (pingTimesRef.current.length > 5) pingTimesRef.current.shift();

                const avg = pingTimesRef.current.reduce((a, b) => a + b, 0) / pingTimesRef.current.length;

                if (avg > 1500) setStrength('poor');
                else if (avg > 600) setStrength('mid');
                else setStrength('good');
            } catch {
                setStrength('poor');
            }
        };

        checkLatency();
        intervalRef.current = setInterval(checkLatency, 10000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [wsConnected]);

    const colors = {
        good: { active: '#22C55E', inactive: '#22C55E40' },
        mid: { active: '#EAB308', inactive: '#EAB30840' },
        poor: { active: '#EF4444', inactive: '#EF444440' },
        offline: { active: '#EF4444', inactive: '#EF444440' },
    };

    const activeBars = strength === 'good' ? 3 : strength === 'mid' ? 2 : 1;
    const { active, inactive } = colors[strength];

    const labels = {
        good: 'Good',
        mid: 'Fair',
        poor: 'Weak',
        offline: 'Offline',
    };

    return (
        <div className="flex items-center gap-1.5" title={`Connection: ${labels[strength]}`}>
            <div className="flex items-end gap-[2px]">
                {[1, 2, 3].map((bar) => (
                    <div
                        key={bar}
                        className="rounded-sm transition-colors duration-300"
                        style={{
                            width: 3,
                            height: bar * 4 + 2,
                            backgroundColor: bar <= activeBars ? active : inactive,
                        }}
                    />
                ))}
            </div>
            <span
                className="font-mono text-[9px] uppercase tracking-wider hidden md:inline"
                style={{ color: active }}
            >
                {labels[strength]}
            </span>
        </div>
    );
}
