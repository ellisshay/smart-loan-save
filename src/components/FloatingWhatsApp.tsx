import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";

const WHATSAPP_NUMBER = "972559961997";
const WHATSAPP_MESSAGE = "שלום, אשמח לקבל מידע נוסף על שירותי EASY MORTE";

export default function FloatingWhatsApp() {
  const { pathname } = useLocation();
  // The quick check has a sticky bottom bar (back / next); keep the button above it.
  const raised = pathname.startsWith("/mortgage-check");
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="צור קשר בוואטסאפ"
      className={`fixed ${raised ? "bottom-24" : "bottom-4"} right-4 z-40 w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 hover:shadow-xl`}
    >
      <MessageCircle size={24} fill="white" strokeWidth={0} />
    </a>
  );
}
