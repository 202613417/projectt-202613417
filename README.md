# ShopNow

University e-commerce demo built with HTML, CSS, JavaScript, and Supabase.

## Verification on 9 November 2026

Continued the existing project. Added product-detail.html with a query-string product ID and live Supabase data; the catalogue now uses the existing Supabase JS client and includes detail links and Low Stock labels. Narrow-screen navigation wraps instead of relying on one long row. The actual product table has no description column, so the detail page states that a description has not been provided.

All 19 application tests passed locally and in the restored existing GitHub Codespace, including five product-detail regressions. Live Chrome checks confirmed catalogue search/filter/sort, stock limits, cart arithmetic and reload persistence. The user completed fresh login; authenticated checkout and the existing Order #2 receipt were read without creating another order. The retained order remains AED 495.00 and Shipped.

The database schema and read-only query results were documented separately for private lab submissions. No migrations were rerun. Historical Lab 1 and Lab 2 snapshots remain in Git; no separate historical Lab 3, Lab 4 or Lab 5 commit was recovered. New evidence is dated 9 November and is not presented as historical evidence.

## Historical preparation status on 3 November 2026

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

## Lab 7 REST verification on 9 November 2026

Run `bash scripts/lab7-rest-checks.sh /tmp/shopnow-lab7` in the existing Codespace. The script uses the existing public publishable key on the apikey header, never a service-role key or user token. Actual results: product GET 200 (20 rows); price/filter plus name sort 200 (11 rows); out-of-stock plus price sort 200 (3 rows). The deliberately invalid isolated POST returned HTTP 401 with PostgreSQL code 42501 for RLS. Guarded PATCH and DELETE against an absent negative ID returned 200 and []; neither changed a row. The complete product catalogue matched before and after. Browser Network separately showed the catalogue GET 200 and JSON response.

An approved Lab 4 name-only update to product 5 was shown in the browser and immediately restored. All 20 product records then matched the pre-demonstration snapshot. No order, price, stock or security policy was changed. The original Lab 1 instructor brief was recovered from the course LMS. No separate historical Lab 3-5 milestones were recovered.

The supplied second-account email matches a confirmed Auth account with a previous sign-in. An earlier Invalid login credentials response does not establish which credential was wrong. A fresh successful second-account registration/login demonstration remains unverified; no password reset or security change was made.
