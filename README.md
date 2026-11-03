# ShopNow

University e-commerce demo built with HTML, CSS, JavaScript, and Supabase.

## Current preparation status

The reviewed authenticated checkout migration was applied manually to the connected Supabase project on 3 November 2026 after approval. A real authenticated browser checkout saved Customer #2, Order #2 and two order-item rows, totaling AED 495.00. Stock was verified: IPhone17 25 to 24, USB-C Cable 20 to 16. The confirmation page showed Paid, then Shipped after an instructor SQL update. No real payment was collected.

All 14 application tests and 22 rollback-only database checks passed. Owner and anonymous access were checked under their actual database roles; unrelated ownership used a simulated JWT identity under the authenticated role, not a second browser login. The resulting order remains in the database.

## Run and test

Serve this folder with a local HTTP server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`.

Run the automated checks with Node.js: `node --test tests/*.test.cjs`.

The browser contains only a Supabase publishable API key. Checkout adds the signed-in user's access token. Do not place a service role key in client code.

## Database preparation

The existing schema uses customer and product tables with bigint identity keys, orders with bigint customer_id, and order_item. Supabase Auth UUIDs are stored separately in orders.auth_user_id by the reviewed migration; existing bigint keys are preserved.

The existing 20261102 migration creates the atomic checkout function, request ID column and unique index. The reviewed `supabase/migrations/20261103_authenticated_checkout.sql` replaces that function with login, account email, ownership, retry payload and quantity checks; adds owner-only order/item reads and a demo Paid status; and grants the authenticated role execution. It keeps anonymous execution denied and all existing RLS settings enabled. This migration has already been applied to the named project. Do not re-run it there: its preflight deliberately stops if orders or installation columns exist. On another compatible empty project, apply it once only after review and authorization.

Checkout calculates totals using database prices, locks stock rows in product order, and creates the customer, order and items in one transaction. Matching request IDs return the same order only when the account and submitted data match.

## Lab 6 flow

Login → Products → Cart → Checkout → Place Order → order-confirmation.html.

After a successful save the confirmation page loads the user's order and its items from Supabase. Payment is simulated; no money is collected. An instructor can update a saved order's status through SQL. Database persistence, server pricing, retries, stock behavior, owner-only reads and SQL status updates were verified. Run `tests/database-checkout.sql` manually in SQL Editor only against the documented test fixture; all probe writes are rolled back. A second actual account login was not tested.
