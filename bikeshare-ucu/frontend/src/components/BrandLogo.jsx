import { Link } from 'react-router-dom';

export default function BrandLogo({ to = '/home', className = 'h-9', light = true }) {
  const img = (
    <img
      src="/images/logo.webp"
      alt="BikeShare UCU"
      className={`${className} w-auto object-contain`}
      style={light ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center shrink-0">
        {img}
      </Link>
    );
  }
  return img;
}
