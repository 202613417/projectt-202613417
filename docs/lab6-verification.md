# Lab 6 verified result

Verified on 3 November 2026 after explicit migration approval.

A signed-in browser session placed Order #2, total AED 495.00, linked to Customer #2. The order contains one IPhone17 at AED 299 and four USB-C Cables at AED 49 each. Order-item IDs are 2 and 3. Server totals, foreign-key relationships and stock deductions matched. Phone stock changed 25 to 24 and cable stock 20 to 16. The cart cleared only after confirmation.

The browser confirmation loaded Paid and then Shipped after an instructor SQL update. Payment was simulated; no funds were collected. The order is retained as evidence.

All 14 Node application tests passed. All 22 database role, pricing, validation, replay and stock checks passed in rollback-only transactions. Temporary tables and grants were rolled back. The real order and stock were unchanged by probes. Identity-sequence gaps from rolled-back inserts are expected.

Owner reads and anonymous denial were verified using actual database roles. Unrelated ownership used a simulated JWT identity under the authenticated role; no second actual browser account was created or logged in.

RLS remains enabled on all application tables. Anonymous RPC execution is denied. Direct client writes to private tables are blocked. The application uses a publishable key plus the signed-in bearer token, never a service role key in browser code.

The Codespace idle shutdown stopped the development preview during testing. Restarting the Codespace and its HTTP server restored the confirmation; this is a development preview, not permanent hosting.

The new migration is already applied to the connected project and must not be re-run there. Evidence and a submission report are delivered separately. No LMS submission was made.
