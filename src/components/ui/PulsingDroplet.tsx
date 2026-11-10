import { Logo } from './Logo';

/** Processing animation: the logo droplet pulsing with expanding ripples. */
export function PulsingDroplet({ size = 120 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size * 1.8, height: size * 1.8 }}
      aria-hidden
    >
      <span className="absolute h-full w-full animate-ripple rounded-full bg-primary/20" />
      <span className="absolute h-full w-full animate-ripple rounded-full bg-primary/15 [animation-delay:0.6s]" />
      <span className="absolute h-3/4 w-3/4 rounded-full bg-primary-light" />
      <div className="animate-pulse-drop">
        <Logo size={size} animated />
      </div>
    </div>
  );
}
