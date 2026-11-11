# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: Healthcare platform administrators, operational directors, and clinical/compliance supervisors for MedsZop.
Situation: Managing a multi-sided healthcare marketplace involving patients, licensed pharmacies, courier logistics partners, and licensed doctors across India.
Job: Monitor high-velocity orders, approve and audit partner credentials, manage prescription fulfillment pipelines, resolve delivery bottlenecks, oversee payments and refunds, and ensure regulatory compliance.

## Product Purpose

MedsZop Admin Panel V2 exists to provide an enterprise-grade command and control platform for the MedsZop digital healthcare ecosystem. Success means zero order fulfillment bottlenecks, instant detection of delayed deliveries or unverified prescriptions, rapid partner credential verification, real-time financial tracking, and transparent operational control with zero data loss.

## Positioning

Unlike generic multi-vendor e-commerce admin panels, MedsZop Admin is designed specifically for regulated pharmaceutical and clinical workflows: prescription verification gates, secret delivery OTP integrity, cold-chain/urgent delivery dispatch, doctor tele-consultation governance, and pharmacy inventory synchronization.

## Operating Context

- Used on desktop and laptop displays (1280px to 2560px), with responsive tablet (768px-1024px) and mobile emergency monitoring (375px-430px).
- High information density with real-time tabular data, status-driven workflows, multi-parameter filtering, and quick actions.
- Connected to centralized Node.js/Express API gateway on Render with MongoDB Atlas and Redis.

## Capabilities and Constraints

- Capabilities:
  - Executive KPI command center (gross merchandise value, order status distributions, active partner counts).
  - Advanced TanStack Table management with multi-column sorting, search, role/status filtering, pagination, and CSV export.
  - Granular marketplace controls: Order tracking, medicine catalog, verified pharmacy directory, patient user records.
  - Healthcare controls: Doctor appointments, prescription workflow status, tele-consultation logs.
  - Operational controls: Delivery tracking, partner application review (Doctor, Pharmacist, Delivery).
  - Financial controls: Payment logs, refund requests, transaction status.
  - System controls: Real-time notifications, administrator activity audit log, platform settings, security toggles.
- Constraints:
  - Role-based server verification: All administrative endpoints enforce `authMiddleware` + `roleMiddleware(["admin"])`.
  - Privacy protections: Delivery OTPs remain hidden from couriers until customer disclosure; prescriptions are secured with authenticated streaming.
  - Zero fabricated data: All metrics and lists reflect real backend endpoints; unbacked capabilities are clearly labeled as planned/roadmap.

## Brand Commitments

- Brand: MedsZop Healthcare
- Voice: Precise, clinical, calm, authoritative, and efficient.
- Palette anchors: Deep slate neutral (`slate-900`/`slate-950` in dark mode, clean crisp `slate-50`/`slate-100` in light mode), medical primary accent (refined deep cyan/teal `#0891b2` / `#06b6d4`), clinical emerald status accents (`#059669` / `#10b981`), regulatory warning amber (`#d97706`).

## Evidence on Hand

- Backend API endpoints in `/backend`: `/api/admin/*`, `/api/orders`, `/api/medicines`, `/api/onboarding/admin/*`, `/api/pharmacy/*`, `/api/doctor/*`, `/api/auth/*`.
- Verified production MongoDB database: `test` on `cluster0.qijtc3b.mongodb.net`.
- Live deployed production domain: `https://admin.medszop.com`.

## Product Principles

1. Task-First Restraint: The interface recedes into the workflow; data and actions are clear without visual noise or gratuitous decoration.
2. Verified Truth: Every number, order status, and applicant detail is drawn from real backend collections; no fake sparklines or mock figures.
3. Information Density with Breathing Room: High-yield data tables with generous padding, tabular numbers, and logical grouping.
4. Fail-Safe Operations: Destructive actions (rejection, role demotion, refunds, cancellation) require explicit confirmation dialogs with audit trails.

## Accessibility & Inclusion

- Compliance Target: WCAG 2.1 AA.
- Contrast ratio $\ge 4.5:1$ for all text, visible focus rings on keyboard navigation, semantic table headers, screen-reader status live-regions, responsive touch targets $\ge 44 \times 44$px on mobile.

