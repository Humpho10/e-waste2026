// Thin wrapper around a Bootstrap Icons glyph (loaded via CDN in index.html —
// see https://icons.getbootstrap.com). Font icons inherit `color`, so the
// existing Tailwind text-color / dark: classes used across the app keep
// working exactly as before; only the `size` prop needs converting to a
// font-size since these aren't SVGs.
export default function Bi({ name, size = 18, className = '', style, ...rest }) {
  return (
    <i
      className={`bi bi-${name} ${className}`}
      style={{ fontSize: size, lineHeight: 1, ...style }}
      {...rest}
    />
  );
}
