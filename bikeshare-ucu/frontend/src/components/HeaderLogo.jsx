import { Link } from 'react-router-dom';

const LOGO_DESKTOP = '/images/logo-header.png';
const LOGO_MOBILE = '/images/logo-mobile.png';

/**
 * Logo del header.
 * Mobile: icono compacto (logo-mobile.png).
 * Desktop: logo completo con zoom por margen del PNG.
 */
export default function HeaderLogo({ to = '/home' }) {
  const inner = (
    <>
      <div className="h-full flex items-center md:hidden shrink-0">
        <img
          src={LOGO_MOBILE}
          alt="BikeShare UCU"
          className="h-11 w-11 object-contain"
          draggable={false}
        />
      </div>
      <div className="hidden md:flex h-full w-[280px] lg:w-[320px] items-center overflow-hidden shrink-0">
        <img
          src={LOGO_DESKTOP}
          alt="BikeShare UCU"
          className="h-16 w-auto max-w-none object-contain object-left"
          style={{ transform: 'scale(2.4)', transformOrigin: 'left center' }}
          draggable={false}
        />
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center h-full shrink-0">
        {inner}
      </Link>
    );
  }
  return <span className="inline-flex items-center h-full shrink-0">{inner}</span>;
}
