import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Precios — AIAIAI",
  description:
    "Elige el plan que mejor se adapta a tus necesidades. Sin contratos. Cancela cuando quieras.",
};

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  highlight: boolean;
  badge: string | null;
  features: string[];
  cta: string;
  ctaHref: string;
}

const plans: Plan[] = [
  {
    name: "Gratis",
    price: "0",
    period: "siempre",
    description: "Perfecto para probar AIAIAI",
    highlight: false,
    badge: null,
    features: [
      "90 créditos gratis",
      "3 videos por mes",
      "Hasta 5 clips por video",
      "Formatos 9:16, 1:1, 16:9",
      "Subtítulos automáticos",
      "Descarga en HD",
    ],
    cta: "Empezar gratis",
    ctaHref: "/",
  },
  {
    name: "Pro",
    price: "19",
    period: "mes",
    description: "Para creadores de contenido",
    highlight: true,
    badge: "Más popular",
    features: [
      "Créditos ilimitados",
      "Videos ilimitados",
      "Hasta 12 clips por video",
      "Cola de múltiples videos",
      "Todos los formatos",
      "Subtítulos + editor de captions",
      "Enlace de compartir público",
      "Descarga en 4K",
      "Sin marca de agua",
    ],
    cta: "Empezar con Pro",
    ctaHref: "/",
  },
  {
    name: "Business",
    price: "49",
    period: "mes",
    description: "Para agencias y equipos",
    highlight: false,
    badge: null,
    features: [
      "Todo de Pro",
      "5 usuarios del equipo",
      "API access",
      "Procesamiento prioritario",
      "Soporte dedicado",
      "Analytics avanzados",
      "Exportación masiva (ZIP)",
      "Integración con Buffer/Hootsuite",
    ],
    cta: "Contactar ventas",
    ctaHref: "/",
  },
];

const faqs = [
  {
    question: "¿Puedo cancelar mi suscripción en cualquier momento?",
    answer:
      "Sí. No hay contratos ni penalizaciones. Puedes cancelar tu plan Pro o Business desde tu panel de cuenta con un clic. Tu acceso permanece activo hasta el fin del período facturado.",
  },
  {
    question: "¿Qué son los créditos y cómo se consumen?",
    answer:
      "Cada minuto de video procesado consume créditos. En el plan Gratis tienes 90 créditos — suficientes para procesar hasta 90 minutos de video. Los planes pagos incluyen créditos ilimitados.",
  },
  {
    question: "¿Hay un período de prueba para Pro o Business?",
    answer:
      "El plan Gratis ya funciona como prueba permanente con 90 créditos. Si decides pasarte a Pro o Business, puedes hacerlo en cualquier momento y el cobro se prorratea según los días restantes del mes.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, Amex) procesadas de forma segura a través de Stripe. También disponemos de facturación para empresas en el plan Business.",
  },
];

export default function PricingPage() {
  return (
    <main className="relative bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Elige tu plan
        </h1>
        <p className="text-lg text-[#737373] mb-8">
          Sin contratos. Cancela cuando quieras.
        </p>

        {/* Billing toggle — UI only */}
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-1 bg-[#111] border border-[#262626] rounded-full p-1 shadow-inner">
            <button className="px-5 py-2 text-sm font-semibold text-white bg-[#262626] rounded-full transition-all shadow-sm">
              Mensual
            </button>
            <button className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-[#737373] hover:text-white rounded-full transition-all">
              Anual
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 text-[10px] font-bold tracking-wide uppercase animate-pulse">
                Ahorra 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div key={plan.name} className="relative flex flex-col">
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 rounded-full shadow-lg shadow-violet-500/30">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div
                className={
                  plan.highlight
                    ? "flex flex-col flex-1 rounded-2xl border-2 border-violet-500/50 bg-gradient-to-b from-violet-500/10 to-[#111] p-8 shadow-2xl shadow-violet-500/20"
                    : "flex flex-col flex-1 rounded-2xl border border-[#262626] bg-[#111] p-8"
                }
              >
                {/* Plan header */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                  <p className="text-sm text-[#737373]">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className={plan.highlight ? "text-5xl font-black text-white" : "text-4xl font-bold text-white"}>
                      ${plan.price}
                    </span>
                    <span className="text-[#737373] mb-1 text-sm">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={plan.ctaHref}
                  className={
                    plan.highlight
                      ? "block text-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 mb-8"
                      : "block text-center py-3 px-6 rounded-xl text-sm font-semibold text-[#a3a3a3] border border-[#262626] hover:border-[#404040] hover:text-white transition-all duration-200 mb-8"
                  }
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <ul className="space-y-3 mt-auto">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-[#a3a3a3]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 pb-24 border-t border-[#1f1f1f] pt-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group bg-[#111] border border-[#262626] rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm font-medium text-white select-none hover:bg-white/5 transition-colors">
                  {faq.question}
                  <span className="ml-4 shrink-0 text-[#525252] group-open:rotate-180 transition-transform duration-200 text-lg leading-none">
                    ↓
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-[#737373] leading-relaxed border-t border-[#1f1f1f]">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">O</span>
            </div>
            <span className="text-sm text-[#737373]">
              © 2025 AIAIAI. Todos los derechos reservados.
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacidad", "Términos", "Contacto"].map((linkLabel) => (
              <a
                key={linkLabel}
                href="#"
                className="text-sm text-[#525252] hover:text-[#a3a3a3] transition-colors"
              >
                {linkLabel}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
