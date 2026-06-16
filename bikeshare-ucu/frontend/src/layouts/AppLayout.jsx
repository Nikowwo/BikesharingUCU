import Navbar from '../components/Navbar';
import { HEADER_OFFSET } from '../components/SiteHeader';

export default function AppLayout({ children, className = '' }) {
  return (
    <div className={`min-h-screen ${HEADER_OFFSET} ${className}`}>
      <Navbar />
      {children}
    </div>
  );
}
