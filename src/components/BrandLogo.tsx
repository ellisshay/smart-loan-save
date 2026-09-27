import logo from "@/assets/easy-morte-logo-concept-a.png";

/** The same identity is used in every site header and workspace. */
export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 shrink-0" dir="rtl">
      <img
        src={logo}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 object-contain"
      />
      <span className="flex flex-col items-start leading-tight whitespace-nowrap">
        <span className="font-display font-extrabold text-lg" dir="ltr">EASY MORTE</span>
        {!compact && <span className="font-body text-[10px] font-medium opacity-70">לוקחים משכנתא בקלות</span>}
      </span>
    </span>
  );
}