# ShopNow

University e-commerce demo built with HTML, CSS, JavaScript, and Supabase.

## Current preparation status

The authenticated checkout and order-confirmation changes are prepared. The 20261103 database migration has **not** been applied to the connected Supabase project. Until it is authorized and applied, checkout cannot persist an order and the confirmation page cannot retrieve one. The live database was inspected on 3 November 2026 and customer, orders, and order_item each contained zero rows.

## Run and test

Serve this folder with a local HTTP server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`.

Run the automated checks with Node.js: `node --test tests/*.test.cjs`.

The browser contains only a Supabase publishable API key. Checkout adds the signed-in user's access token. Do not place a service role key in client code.

## Database preparation

The existing schema uses customer and product tables with bigint identity keys, orders with bigint customer_id, and order_item. Supabase Auth UUIDs are stored separately in orders.auth_user_id by the prepared migration; existing bigint keys are preserved.

The existing 20261102 migration creates the atomic checkout function, request ID column and unique index. The prepared `supabase/migrations/20261103_authenticated_checkout.sql` replaces that function with login, account email, ownership, retry payload and quantity checks; adds owner-only order/item reads and a demo Paid status; and grants the authenticated role execution. It keeps anonymous execution denied and all existing RLS settings enabled. Apply the new migration once only, after review and authorization. It has not been exercised against the live database.

Checkout calculates totals using database prices, locks stock rows in product order, and creates the customer, order and items in one transaction. Matching request IDs return the same order only when the account and submitted data match.

## Lab 6 flow

Login → Products → Cart → Checkout → Place Order → order-confirmation.html.

After a successful save the confirmation page loads the user's order and its items from Supabase. Payment is simulated; no money is collected. An instructor can update a saved order's status through SQL. Database persistence, cross-account access tests, and SQL status demonstration remain to be verified after the migration is applied.
