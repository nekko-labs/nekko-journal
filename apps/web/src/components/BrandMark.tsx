/**
 * The Getsu mark: a small black cat curled asleep on a gold crescent moon.
 * Rendered from the canonical /logo.png so the favicon, PWA icon, and in-app
 * brand stay in lockstep.
 */
export default function BrandMark({ size = 26, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.png`}
      width={size}
      height={size}
      alt="Getsu"
      className={className}
      style={{ borderRadius: size * 0.22, display: 'block', ...style }}
      draggable={false}
    />
  );
}
