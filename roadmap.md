# Roadmap

## תיקון הבדיקה המהירה
- [x] פסיקים בשדות סכום בבדיקה המהירה
- [x] שם וטלפון חובה לפני תמהילים ושמירת פנייה משוערת עם הסכמה
- [x] אימות השמירה והמעבר לתוצאה (נתוני בדיקה זמניים הוסרו)

## תיאום שלבי התיק
- [x] תיאום נתונים בין השאלון לאזור האישי ושמירה ללא מילוי חוזר
- [x] סימון השלב הנוכחי ושלבים שהושלמו בצד, עם בדיקות

## הודעות ללקוחות
- [x] מיילים ללקוחות כוללים מיתוג, הסבר קצר על השירות ופרטי קשר; הודעות פנימיות נשארות נפרדות
- [x] כתובת האתר, פרטי הקשר במיילים, כתובת התשובה והודעות למנהל: info@easymorte.co.il
- [ ] משלוח בפועל מ-info@easymorte.co.il — ממתין להגדרת ואימות דומיין מייל

## מיתוג
- [x] לוגו EASY MORTE אחיד בכותרות האתר והאזורים האישיים, עם אייקון לשונית תואם

## מרכז ידע EasyMorte
- [x] מודל נתונים למאמרים (בלוקים, FAQ, קישורים פנימיים, מחשבון)
- [x] 9 אשכולות + מאמרי Pillar לאשכולות התוכן (משכנתא ראשונה, מחזור, תמהילים, אישור עקרוני, עצמאים, יועץ, מסמכים, מכירות פומביות)
- [x] מאמרי שאלות Long Tail עם דוגמאות מספריות (19 מאמרים, כולל תשובה ישירה ו״שאלות שאנשים שואלים גם״)
- [x] עמוד מרכז הידע (/knowledge) עם אשכולות, חיפוש וכרטיסי מאמרים
- [x] תבנית מאמר Landing Page: פירורי לחם, תשובה ישירה, תוכן עניינים דביק, טבלאות, מחשבון, FAQ, CTA נייד דביק
- [x] תמונות דירות/בתים/משפחה עם תגי אלט רלוונטיים וטעינה עצלה
- [x] קישורי תו השירות (/pricing) ו־CTA במרכז הידע ובתבנית המאמר
- [x] עדכון ניווט: ״משכנתאפדיה״ מפנה ל־/knowledge
- [x] הפניית /blog למרכז הידע החדש (מאמרים ישנים נשארים זמינים ב־/blog/:slug)
- [x] עוגן id="assessment" לשאלון בדף הבית
- [x] בדיקה חזותית מקצה לקצה + בדיקת קישורים פנימיים בין מאמרים
- [ ] הרחבת מאגר המאמרים (שאר שאלות האשכולות מהאפיון, 160+ רעיונות) — ממשיך בשלבים
- [x] SEO טכני: prerender, sitemap, robots, canonical, schema
- [ ] חיבור Google Search Console — ממתין לקוד אימות

## תפעול מלא בעצמנו (A-Z)
- [x] הסרת ההבטחה שהנתונים נשלחים ל-5 יועצים; עמוד "הצעות" נגיש רק כיועצים חיצוניים פעילים, ומפנה למכרז

## Release 2026-10 (uploaded full task)
- [x] Stage 1: business details (info@easymorte.co.il, Trumpeldor 11 Kfar Saba, privacy 09-7734442, public phone stays 055-996-1997)
- [ ] Stage 2: value-first funnel + pay-first signup — BLOCKED: server-side Tranzila verification needs terminal API key
- [x] 2.1–2.5: quick check at /mortgage-check (consent before any save), inline result + mixes (unit-tested), email result; balance tool moved to /balance-check
- [x] Stages 3–6: new terms/privacy/cookies/accessibility texts, /cancel + cancellation_requests, consents v2026-10-v2 with re-consent in dashboard
- [x] Stage 7: advisors can no longer insert lead_purchases; new tables RLS, no anon reads
- [x] Stage 8: /terms /privacy /cookies /accessibility /cancel, /legal/* redirects, sitemap lastmod
- [ ] 2.6–2.8 pay-first signup, orders table, email code login — BLOCKED on Tranzila API key
- [ ] 2.9 prefill intake from quick check; 2.10 bank-transfer consent screen in tender; 5.3/5.4 payment disclosure box + confirmation email (part of payment flow)

## אישור תשלום ידני ודף אודות
- [x] מנהל יכול לסמן תיק כשולם ללא חיוב (מזומן/העברה בנקאית/בדיקה) דרך admin_mark_payment עם רישום ביקורת
- [x] שי אליס הועבר לראש דף האודות
