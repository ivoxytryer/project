import { useMemo } from "react";

interface Drop {
  left: number;
  height: number;
  duration: number;
  delay: number;
  opacity: number;
}

/** Генерирует стабильный набор капель дождя. */
function makeDrops(count: number): Drop[] {
  const drops: Drop[] = [];
  for (let i = 0; i < count; i++) {
    drops.push({
      left: Math.random() * 100,
      height: 14 + Math.random() * 26,
      duration: 0.7 + Math.random() * 1.1,
      delay: Math.random() * 3,
      opacity: 0.2 + Math.random() * 0.5,
    });
  }
  return drops;
}

export function RainBackground() {
  const drops = useMemo(() => makeDrops(90), []);

  return (
    <div className="bg-scene" aria-hidden>
      <div className="bg-clouds" />
      <div className="rain-layer">
        {drops.map((d, i) => (
          <span
            key={i}
            className="rain-drop"
            style={{
              left: `${d.left}%`,
              height: `${d.height}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
              opacity: d.opacity,
            }}
          />
        ))}
      </div>
    </div>
  );
}
