import { useMemo } from "react";

interface Drop {
  left: number;
  height: number;
  duration: number;
  delay: number;
  opacity: number;
}

/** Стабильный набор мягких размытых капель. */
function makeDrops(count: number): Drop[] {
  const drops: Drop[] = [];
  for (let i = 0; i < count; i++) {
    drops.push({
      left: Math.random() * 99.5,
      height: 36 + Math.random() * 74,
      duration: 3.2 + Math.random() * 4.2,
      delay: Math.random() * 6,
      opacity: 0.14 + Math.random() * 0.22,
    });
  }
  return drops;
}

export function RainBackground() {
  const drops = useMemo(() => {
    const mobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;
    return makeDrops(mobile ? 18 : 46);
  }, []);

  return (
    <div className="rain-layer" aria-hidden>
      {drops.map((d, i) => (
        <span
          key={i}
          className="rain-drop"
          style={{
            left: `${d.left}%`,
            height: `${d.height}px`,
            animationDuration: `${d.duration}s`,
            animationDelay: `${-Math.random() * d.duration}s`,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  );
}
