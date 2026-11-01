import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function HomeFloatingActions({ blocked }: { blocked: boolean }) {
  const [pastHero, setPastHero] = useState(false);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const hero = document.querySelector(".home-editorial-hero");
    if (!hero) return;
    const update = () => setPastHero(hero.getBoundingClientRect().bottom <= 0);
    const observer = new IntersectionObserver(update, { threshold: 0 });
    observer.observe(hero);
    update();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => {
      const overlayOpen = Array.from(document.querySelectorAll(
        '[data-floating-cta-blocker], [aria-modal="true"], [role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
      )).some((element) => element.getClientRects().length > 0);
      const editing = window.matchMedia("(max-width: 767px)").matches &&
        document.activeElement instanceof HTMLElement &&
        document.activeElement.matches('input, textarea, select, [contenteditable="true"]');
      const keyboardOpen = window.matchMedia("(max-width: 767px)").matches &&
        !!window.visualViewport && window.innerHeight - window.visualViewport.height > 150;
      setCovered(overlayOpen || editing || keyboardOpen);
    };
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state", "aria-modal", "hidden"] });
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  const visible = pastHero && !blocked && !covered;

  return (
    <nav
      aria-label="פעולות משכנתא"
      aria-hidden={!visible}
      dir="rtl"
      className={`home-floating-actions z-40 flex items-center gap-2 rounded-full border border-border bg-card text-card-foreground shadow-card ${visible ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-1.5 pointer-events-none"}`}
    >
      <Button asChild size="default" className="h-11 w-[92px] md:w-[104px] shrink-0 rounded-full px-2 text-sm motion-reduce:transition-none">
        <Link to="/mortgage-check" tabIndex={visible ? 0 : -1}>פתיחת תיק</Link>
      </Button>
      <Button asChild variant="ghost" size="default" className="h-11 min-w-0 flex-1 rounded-full px-1 whitespace-normal text-xs md:text-[13px] leading-4 font-medium text-foreground motion-reduce:transition-none">
        <Link to="/balance-check" tabIndex={visible ? 0 : -1}>בדיקת המשכנתא שלי בחינם</Link>
      </Button>
    </nav>
  );
}