# Design System & UI/UX Specification: Punch Item List Web Application

## 1. Overview & Objectives
The **Punch Item List Web Application** is a specialized digital platform designed for contractors, Owner Engineers (OE), and Owners to track, assign, monitor, and resolve site deficiencies (punch items) efficiently during power plant construction and testing.

---

## 2. Color Palette & Theming

### 2.1 Primary & Brand Colors
*   **Primary Blue (`#2E5BFF` / `#3B82F6`):** Used for primary navigation headers, active sidebar states, and primary call-to-action (CTA) buttons.
*   **Primary Dark (`#1E293B`):** Deep slate used for main text headings and structural high-contrast text.

### 2.2 Neutral & Surface Colors
*   **App Background (`#F4F6F9`):** Soft light grey-blue backdrop for clean data presentation.
*   **Card Surface (`#FFFFFF`):** Pure white container background for dashboard widgets, tables, and form inputs.
*   **Border & Divider (`#E2E8F0`):** Subtle light grey for separation of UI elements and table rows.
*   **Text Muted (`#64748B`):** Secondary text color for timestamps, subheadings, and metadata.

### 2.3 Status Colors (Aligned with Project Workflow)
*   **Open (`#EF4444` - Red):** Newly created punch items by the contractor awaiting action.
*   **Canceled (`#94A3B8` - Slate Grey):** Punch items canceled by the contractor due to data entry errors.
*   **Submit to OE (`#3B82F6` - Blue):** Items under review by the Owner Engineer.
*   **Submit to Owner (`#8B5CF6` - Purple):** Items approved by OE, now pending final review by the Owner.
*   **Rejected (`#F59E0B` - Amber/Orange):** Items sent back to the contractor with required revision notes/reasons.
*   **Closed (`#10B981` - Green):** Items fully approved and successfully closed out.

---

## 3. Typography
*   **Font Family:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
*   **Scale:**
    *   **Page Title / H1:** 24px / Bold (`#1E293B`)
    *   **Section Header / H2:** 18px / Semi-bold (`#1E293B`)
    *   **Card Title / H3:** 14px / Medium (`#475569`)
    *   **Body Text:** 14px / Regular (`#334155`)
    *   **Metadata / Caption:** 12px / Regular (`#64748B`)

---

## 4. Layout & UI Components

### 4.1 Layout Structure
*   **App Shell:** Fixed left sidebar (width: 260px) for navigation (Dashboard, Punch List, Import/Export, User Management, Settings) with a top header bar for user profile, project selector, and notifications.
*   **Dashboard Grid:** Modular card layout showing total punch items, remaining items, and breakdown by status and discipline.

### 4.2 Key Components & Features
*   **Punch Item Data Table:** High-density table featuring filters for **Disciplines** (Civil, Mechanical, Electrical, Control & Instrument, Commissioning) and **Statuses**.
*   **Before / After Image Comparison:** Side-by-side or tabbed image viewer for contractors to upload resolution proofs and for OE/Owners to review.
*   **Workflow Action Modals:** 
    *   *Reject Modal:* Includes mandatory text-filling for reasons/comments.
    *   *Bulk Excel Upload Modal:* Supports fast data importing without overwriting historical records.
*   **Status Badges:** Rounded pill badges (`border-radius: 9999px`) utilizing soft background tints mapped to the 6 distinct statuses.

---

## 5. Responsive & Accessibility Guidelines
*   **Contrast Ratio:** Meets WCAG AA standards.
*   **Mobile Adaptability:** Optimized for tablets and mobile devices during field walkdowns, paving the way for future PWA expansion.