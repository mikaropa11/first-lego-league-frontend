'use client';

export interface AwardItem {
    key: string;
    name: string;
}

interface Particle {
    id: number;
    left: number;
    delay: number;
    duration: number;
    width: number;
    height: number;
    color: string;
}

const CONFETTI_COLORS = ['#FFD700', '#FFC300', '#FF8C00', '#FFE066', '#FFA500', '#FFDF00', '#F4C430'];

const PARTICLES: Particle[] = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    left: (i * 13 + 7) % 100,
    delay: ((i * 37) % 30) / 10,
    duration: 2 + ((i * 23) % 25) / 10,
    width: 6 + (i * 7) % 8,
    height: 4 + (i * 11) % 5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

export default function AwardSection({ awards }: Readonly<{ awards: AwardItem[] }>) {
    return (
        <>
            <style>{`
                @keyframes gold-shimmer {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes confetti-fall {
                    0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(120px) rotate(600deg); opacity: 0; }
                }
                @keyframes champion-pulse {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.7; }
                }
            `}</style>

            <div
                className="relative mt-8 rounded-lg p-[3px]"
                style={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFE566, #FF8C00, #FFD700)',
                    backgroundSize: '300% 300%',
                    animation: 'gold-shimmer 4s ease infinite',
                }}
            >
                <div className="relative overflow-hidden rounded-md bg-amber-50/95 px-6 py-5 dark:bg-amber-950/90">

                    {PARTICLES.map(p => (
                        <div
                            key={p.id}
                            className="pointer-events-none absolute rounded-sm"
                            style={{
                                left: `${p.left}%`,
                                top: 0,
                                zIndex: 0,
                                width: p.width,
                                height: p.height,
                                backgroundColor: p.color,
                                animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in-out infinite`,
                            }}
                        />
                    ))}

                    <div className="relative z-10">
                        <div className="mb-4 flex items-center gap-2">
                            <span className="text-3xl" aria-hidden="true">🏆</span>
                            <span
                                className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400"
                                style={{ animation: 'champion-pulse 2s ease-in-out infinite' }}
                            >
                                Current Champion
                            </span>
                        </div>

                        <ul className="space-y-2">
                            {awards.map(award => (
                                <li
                                    key={award.key}
                                    className="text-base font-semibold text-amber-900 dark:text-amber-100"
                                >
                                    {award.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
