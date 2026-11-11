# Design System — MedsZop Admin Panel V2

<!-- impeccable:design-schema 1 -->

## Design Direction & Mode

- **Mode:** `Operate` (High-density administrative interface, precision workflows, rapid decision-making).
- **Inspirations:** Stripe Dashboard (data tables & financial rigor), Linear (keyboard navigation, command palette, tight spacing rhythm), Vercel (monochrome neutrality, crisp borders, dark/light coherence).
- **Core Aesthetic:** Clinical SaaS precision. No gradient text, no fuzzy drop-shadows, no oversized decorative cards. High clarity, authoritative typography, tabular numerical alignment.

---

## Color Tokens

```css
/* Color Palette */
:root {
  --background: 210 40% 98%;      /* Clean light slate */
  --foreground: 222 47% 11%;      /* Deep midnight slate */
  --card: 0 0% 100%;              /* Pure white card surface */
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  
  --primary: 199 89% 48%;         /* Clinical Cyan / Electric Blue */
  --primary-foreground: 210 40% 98%;
  
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222 47% 11.2%;
  
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  --accent: 199 89% 94%;
  --accent-foreground: 199 89% 30%;
  
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 199 89% 48%;
  --radius: 0.5rem;
}

.dark {
  --background: 224 71% 4%;       /* Midnight deep navy/black */
  --foreground: 213 31% 91%;      /* Crisp high-contrast off-white */
  --card: 224 71% 7%;             /* Elevated dark surface */
  --card-foreground: 213 31% 91%;
  --popover: 224 71% 7%;
  --popover-foreground: 213 31% 91%;
  
  --primary: 199 89% 48%;
  --primary-foreground: 224 71% 4%;
  
  --secondary: 222 47% 11%;
  --secondary-foreground: 210 40% 98%;
  
  --muted: 223 47% 11%;
  --muted-foreground: 215.4 16.3% 56.9%;
  
  --accent: 216 34% 17%;
  --accent-foreground: 210 40% 98%;
  
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  --border: 216 34% 17%;
  --input: 216 34% 17%;
  --ring: 199 89% 48%;
}
```

### Semantic Status Palette
- **Success / Verified:** Emerald (`text-emerald-600 dark:text-emerald-400`, `bg-emerald-500/10`, `border-emerald-500/20`)
- **Warning / Review Needed:** Amber (`text-amber-600 dark:text-amber-400`, `bg-amber-500/10`, `border-amber-500/20`)
- **Urgent / Danger / Rejected:** Rose (`text-rose-600 dark:text-rose-400`, `bg-rose-500/10`, `border-rose-500/20`)
- **Information / Processing:** Sky (`text-sky-600 dark:text-sky-400`, `bg-sky-500/10`, `border-sky-500/20`)
- **Neutral / Draft / Archived:** Slate (`text-slate-500 dark:text-slate-400`, `bg-slate-500/10`, `border-slate-500/20`)

---

## Typography & Numerals

- **Font Family:** System Sans stack (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`) optimized for rendering speed, crisp rendering on high-DPI and standard monitors.
- **Tabular Figures:** All financial figures, quantities, timestamps, order IDs, and status metrics MUST apply `font-variant-numeric: tabular-nums` or `font-mono text-xs` for vertical alignment across table rows.
- **Heading Scale:** Tight, fixed REM steps:
  - Page Title: `text-2xl font-bold tracking-tight`
  - Section Header: `text-lg font-semibold tracking-tight`
  - Card Title: `text-sm font-medium text-muted-foreground`
  - Body Text: `text-sm leading-normal`
  - Microcopy / Metadata: `text-xs text-muted-foreground`
- **Banned:** No gradient text, no display serif fonts in UI controls, no uppercase tracking without positive letter-spacing (`tracking-wider`).

---

## Layout Hierarchy

```
+-----------------------------------------------------------------------------------+
|  SIDEBAR (Collapsible, w-64 / w-16)  |  HEADER (h-14, sticky top, border-b)       |
|  - Logo & Platform Badge             |  - Breadcrumbs & Current Section           |
|  - Overview (Dashboard, Analytics)   |  - Global Search (Cmd+K)                   |
|  - Marketplace (Orders, Medicines)   |  - Live Status Indicator                   |
|  - Healthcare (Doctors, Prescripts)  |  - Notifications Drawer Toggle             |
|  - Operations (Delivery, Partners)   |  - Theme Switcher (Dark/Light)             |
|  - Business (Payments, Refunds)      |  - Admin Profile & Quick Logout            |
|  - System (Audit Logs, Settings)     |--------------------------------------------|
|                                      |  MAIN CONTENT VIEWPORT (Scrollable)        |
|  - Bottom Collapse Toggle            |  - Page Header & Action Bar                |
|                                      |  - KPI Metric Strip (with trends)          |
|                                      |  - Primary Visualizations & Charts         |
|                                      |  - Advanced Data Table (TanStack Table)    |
+-----------------------------------------------------------------------------------+
```

---

## Advanced Tables (TanStack Table Specification)

1. **Header Row:** Sticky, uppercase micro-headers (`text-xs font-semibold text-muted-foreground uppercase tracking-wider`).
2. **Sorting:** Clickable column headers with visual ascending/descending caret indicators.
3. **Filtering:** Global text search + per-column faceted filter pills (e.g. Status: `Delivered`, `Placed`, `Cancelled`).
4. **Pagination:** Compact server/client pagination with records-per-page selector (10, 25, 50, 100) and page jumper.
5. **Row Selection & Bulk Actions:** Checkboxes for multi-selection with bulk action toolbar (e.g. Export CSV, Mark Verified).
6. **Detail Drawer:** Clicking a row opens a slide-over drawer showing full transaction details, line items, customer address, and status history.
7. **States:**
   - Loading: 5-row animated pulse skeleton matching column widths.
   - Empty State: Centered illustration/icon with descriptive copy and clear reset action.
   - Error State: Warning banner with retry button.

---

## Accessibility & Interaction Standards

- **Focus Rings:** `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- **Keyboard Navigation:** Full tab order across sidebar, search, table rows, and modal dialogs.
- **Motion:** Transitions limited to `150ms-200ms ease-out`. Zero decorative looping animations.
- **Touch Targets:** Minimum $40 \times 40$px on touch devices.
- **Contrast:** Strict $\ge 4.5:1$ contrast ratio for all text elements.

