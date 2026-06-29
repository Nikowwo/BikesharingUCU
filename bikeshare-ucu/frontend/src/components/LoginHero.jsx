export default function LoginHero() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 relative min-h-full"
      style={{
        backgroundImage:
          "linear-gradient(rgba(27,38,59,0.4), rgba(27,38,59,0.4)), url('/images/login-pic.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="bg-black/45 backdrop-blur-sm rounded-2xl p-8 max-w-md text-white">
          <h2 className="font-asap font-semibold text-heading-md mb-4">
            ¿Estudiás en la UCU y querés alquilar una bici?
          </h2>
          <p className="text-sm leading-relaxed text-white/90">
            Te ofrecemos una amplia variedad de bicis para alquilar. Es crucial para nosotros
            cuidar el medio ambiente y, también, la salud de todos nuestros estudiantes y funcionarios.
            Formá parte del cambio y empezá a moverte en bici. Cuidate y cuidanos a todos.
          </p>
        </div>
      </div>
    </div>
  );
}
