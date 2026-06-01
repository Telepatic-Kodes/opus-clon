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
    <main
      className="relative text-white min-h-screen overflow-x-hidden"
      style={{ background: "#0B0C10" }}
    >
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 text-center">
        <h1
          className="font-black uppercase text-center mb-4"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px,6vw,80px)",
          }}
        >
          ELIGE<br />
          <span style={{ color: "#A8FF00" }}>TU PLAN.</span>
        </h1>
        <p
          className="text-lg mb-8"
          style={{ color: "#6B6D82", fontFamily: "var(--font-sans)" }}
        >
          Sin contratos. Cancela cuando quieras.
        </p>

        {/* Billing toggle — UI only */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="inline-flex items-center gap-1 p-1"
            style={{
              border: "1px solid #1E2030",
              background: "#12131A",
            }}
          >
            <button
              className="px-5 py-2 text-sm font-semibold transition-all"
              style={{
                background: "#A8FF00",
                color: "#0B0C10",
                fontFamily: "var(--font-mono)",
              }}
            >
              Mensual
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold transition-all"
              style={{ color: "#6B6D82", fontFamily: "var(--font-mono)" }}
            >
              Anual
              <span
                className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
                style={{
                  background: "rgba(168,255,0,0.10)",
                  border: "1px solid rgba(168,255,0,0.30)",
                  color: "#A8FF00",
                }}
              >
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
                  <span
                    className="px-3 py-1 text-xs font-semibold uppercase tracking-widest"
                    style={{
                      background: "#A8FF00",
                      color: "#0B0C10",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div
                className="flex flex-col flex-1 p-8"
                style={
                  plan.highlight
                    ? {
                        background: "#12131A",
                        border: "2px solid #A8FF00",
                        boxShadow: "0 0 40px rgba(168,255,0,0.10)",
                      }
                    : {
                        background: "#12131A",
                        border: "1px solid #1E2030",
                      }
                }
              >
                {/* Plan header */}
                <div className="mb-6">
                  <h2
                    className="text-xl font-bold mb-1"
                    style={{ color: "#F0F0F2", fontFamily: "var(--font-display)" }}
                  >
                    {plan.name}
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: "#6B6D82", fontFamily: "var(--font-sans)" }}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span
                      className="font-black"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: plan.highlight ? "3rem" : "2.5rem",
                        color: plan.highlight ? "#A8FF00" : "#F0F0F2",
                      }}
                    >
                      ${plan.price}
                    </span>
                    <span
                      className="mb-1 text-sm"
                      style={{ color: "#6B6D82", fontFamily: "var(--font-mono)" }}
                    >
                      /{plan.period}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={plan.ctaHref}
                  className="block text-center py-3 px-6 text-sm font-semibold transition-all duration-200 mb-8 uppercase tracking-widest"
                  style={
                    plan.highlight
                      ? {
                          background: "#A8FF00",
                          color: "#0B0C10",
                          fontFamily: "var(--font-display)",
                        }
                      : {
                          border: "1px solid #1E2030",
                          color: "#6B6D82",
                          fontFamily: "var(--font-mono)",
                        }
                  }
                  onMouseEnter={
                    plan.highlight
                      ? undefined
                      : undefined
                  }
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <ul className="space-y-3 mt-auto">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{ color: "#A8FF00" }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: "#6B6D82", fontFamily: "var(--font-sans)" }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        className="px-4 sm:px-6 pb-24 pt-16"
        style={{ borderTop: "1px solid #1E2030" }}
      >
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl font-bold text-center mb-10 uppercase tracking-widest"
            style={{ color: "#F0F0F2", fontFamily: "var(--font-display)" }}
          >
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group overflow-hidden"
                style={{ background: "#12131A", border: "1px solid #1E2030" }}
              >
                <summary
                  className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm select-none transition-colors"
                  style={{
                    color: "#F0F0F2",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {faq.question}
                  <span
                    className="ml-4 shrink-0 group-open:rotate-180 transition-transform duration-200 text-lg leading-none"
                    style={{ color: "#6B6D82" }}
                  >
                    ↓
                  </span>
                </summary>
                <div
                  className="px-5 pb-5 pt-1 text-sm leading-relaxed"
                  style={{
                    borderTop: "1px solid #1E2030",
                    color: "#6B6D82",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 px-4 sm:px-6"
        style={{ borderTop: "1px solid #1E2030" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="text-sm"
              style={{ color: "#6B6D82", fontFamily: "var(--font-mono)" }}
            >
              © 2025 AIAIAI. Todos los derechos reservados.
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacidad", "Términos", "Contacto"].map((linkLabel) => (
              <a
                key={linkLabel}
                href="#"
                className="text-sm transition-colors"
                style={{ color: "#6B6D82", fontFamily: "var(--font-mono)" }}
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
