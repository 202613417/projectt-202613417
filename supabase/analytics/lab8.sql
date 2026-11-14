-- Run the six SELECTs separately in Supabase SQL Editor and export each result.
-- Amounts use AED. Paid and shipped orders remain included.
-- Product units and category revenue follow the handout's all-line-items scope.
SELECT COALESCE(SUM(total_amount), 0) AS total_revenue,
       COUNT(*) AS number_of_orders,
       ROUND(AVG(total_amount), 2) AS avg_order_value
FROM public.orders
WHERE status <> 'Cancelled';

SELECT COUNT(DISTINCT customer_id) AS number_of_customers
FROM public.orders
WHERE status <> 'Cancelled';

SELECT p.name, SUM(oi.quantity) AS units_sold
FROM public.order_item oi
JOIN public.product p ON p.product_id = oi.product_id
GROUP BY p.product_id, p.name
ORDER BY units_sold DESC, p.name, p.product_id
LIMIT 10;

SELECT c.category_name, SUM(oi.quantity * oi.unit_price) AS category_revenue
FROM public.order_item oi
JOIN public.product p ON p.product_id = oi.product_id
JOIN public.category c ON c.category_id = p.category_id
GROUP BY c.category_id, c.category_name
ORDER BY category_revenue DESC, c.category_name;

SELECT DATE_TRUNC('month', order_date)::date AS month,
       SUM(total_amount) AS monthly_revenue
FROM public.orders
WHERE status <> 'Cancelled'
GROUP BY month
ORDER BY month;

SELECT status, COUNT(*) AS orders
FROM public.orders
GROUP BY status
ORDER BY orders DESC, status;
