# GravAcademy UI Design System

## Direction

Smart, calm and trustworthy academic software. Keep the existing orange/amber brand identity and the current homepage hero unchanged. Prefer clear hierarchy, practical spacing and content-first layouts over decorative effects.

## Visual rules

- Use the existing semantic tokens in `app/globals.css` for page, surface, text and borders.
- Primary actions use Grav orange; secondary actions use neutral outlined surfaces.
- Use one surface treatment per component: a light border and subtle shadow. Avoid stacking blur, heavy shadow, gradient and thick borders together.
- Keep card radii consistent within a page and avoid excessive rounded containers.
- Use icons as small line icons with a single semantic accent; do not place every icon inside a gradient badge.
- Keep headings strong but compact. Body copy should be readable and short.
- Preserve generous whitespace and consistent vertical rhythm between sections.
- Tables, forms and dashboards should prioritize scanability and keyboard-friendly controls.

## Responsive rules

- Design mobile-first; tables may scroll horizontally rather than shrink unreadably.
- Keep touch targets at least 40px high.
- Stack two-column forms and cards below the `md` breakpoint.
- Keep important actions visible without relying on hover.

## Do not

- Do not redesign the hero section without explicit approval.
- Do not introduce a new color family for individual sections.
- Do not use decorative text labels, excessive gradients, glassmorphism or animated background blobs unless they communicate state.
