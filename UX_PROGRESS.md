# UX Improvement Progress

## 2026-04-03 09:10 Completed: Sidebar Cleanup
What changed: Reduced sidebar from 12+ items to 5 main items (Overview, People, Classes, Finances, Team). Merged Students+Parents into "People" with sub-nav. Merged Income/Expense/Suppliers into "Finances" with sub-nav. Moved "Buy Credits" to sidebar bottom as a small link. Sub-nav items now have reduced opacity when not active, creating visual hierarchy without section labels.

Files modified:
- `file 'src/pages/Dashboard.tsx'` — NAV array reduced to 5 items, PEOPLE_NAV and FINANCES_NAV as sub-items
- `file 'src/pages/Dashboard.css'` — Added opacity styling for sub-nav items
