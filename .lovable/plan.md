
## Conversion Funnel Rebuild Plan

### Stage 0 – Hero with Instant Calculator
- Replace current HomePage hero with dual sliders (property price, income) + 3 pill buttons (purpose)
- Live-calculated outputs: approval chance badge, estimated monthly payment, max loan
- CTA scrolls to Stage 1

### Stage 1 – Quick Quiz (same page, scroll)
- 5 questions as large card-based UI with progress bar
- Q5 conditional: upload button if user has existing bank offer
- All answers saved to localStorage

### Stage 2 – AI Score Reveal (no auth)
- Animated score circle with count-up
- 3 mortgage track cards with recommended highlight
- Urgency block with BOI rate decision date
- If uploaded offer: comparison block
- CTA triggers registration modal

### Stage 3 – Registration Wall (modal)
- Minimal form: name, phone, email (optional)
- On submit: create profile + lead in Supabase via edge function (no auth.users needed for lead capture)
- Redirect to /results or /dashboard

### Stage 4 – Dashboard Upsell (enhance existing /results page)
- Add social proof counter, ROI line, 48h countdown timer
- Stripe payment link button + WhatsApp secondary CTA

### Files to create/modify:
1. **src/pages/HomePage.tsx** – Complete rewrite as funnel
2. **src/pages/ResultsPage.tsx** – Add countdown timer, social proof, ROI line
3. **supabase/functions/capture-lead/index.ts** – New edge function for anonymous lead capture
4. **Database migration** – Allow anonymous inserts to profiles/leads for lead capture

### What stays the same:
- All other pages, routes, and components unchanged
- Layout wrapper still used for HomePage
