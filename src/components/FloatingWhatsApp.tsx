import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "972501234567"; // Replace with actual number
const WHATSAPP_MESSAGE = "שלום, אשמח לקבל מידע נוסף על שירותי EasyMorte";

export default function FloatingWhatsApp() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="צור קשר בוואטסאפ"
      className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 hover:shadow-xl"
    >
      <MessageCircle size={28} fill="white" strokeWidth={0} />
    </a>
  );
}
