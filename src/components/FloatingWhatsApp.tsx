import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const WHATSAPP_NUMBER = "972559961997";
const GENERIC = "שלום, אשמח לקבל מידע נוסף על שירותי EASY MORTE";

// Service pages name their topic, so the request arrives with its context.
const TOPICS: [string, string][] = [
  ["/mortgage-refinance", "מחזור משכנתא"],
  ["/refinance-calculator", "מחזור משכנתא"],
  ["/first-mortgage", "משכנתא ראשונה"],
  ["/mortgage-advisor", "ייעוץ משכנתא"],
  ["/mortgage-tender", "מכרז בנקים למשכנתא"],
  ["/mortgage", "משכנתא חדשה לרכישת דירה"],
];

export function whatsappMessageFor(pathname: string): string {
  const topic = TOPICS.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1];
  return topic ? `שלום, הגעתי מעמוד ${topic} ב EASY MORTE ואשמח לקבל מידע.` : GENERIC;
}

export default function FloatingWhatsApp() {
  const { pathname } = useLocation();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessageFor(pathname))}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="צור קשר בוואטסאפ"
      className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 hover:shadow-xl"
    >
      <MessageCircle size={24} fill="white" strokeWidth={0} />
    </a>
  );
}
