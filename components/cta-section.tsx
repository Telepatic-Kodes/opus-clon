import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          ¿Listo para crear{" "}
          <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            clips virales?
          </span>
        </h2>
        <p className="text-lg text-[#737373] mb-10">
          Miles de creadores ya están convirtiendo sus videos en contenido viral con IA.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
        >
          Empezar gratis ahora →
        </Link>

        <p className="mt-5 text-sm text-[#525252]">
          Sin tarjeta de crédito · 90 créditos gratis · Cancela cuando quieras
        </p>
      </div>
    </section>
  );
}
