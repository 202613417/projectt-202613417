(() => {
  'use strict';
  const message = document.getElementById('confirmation-message');
  async function loadConfirmation() {
    try {
      const id = new URLSearchParams(window.location.search).get('id');
      if (!id || !/^[1-9][0-9]*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        throw new Error('The order number is invalid.');
      }
      const user = await getCurrentUser();
      if (!user) { window.location.replace('login.html'); return; }
      const {data: order, error} = await authClient.from('orders')
        .select('order_id,total_amount,status,order_item(quantity,unit_price,product(name))')
        .eq('order_id', id).single();
      if (error || !order) throw new Error('This order is unavailable or does not belong to your account.');
      if (!Array.isArray(order.order_item) || !order.order_item.length || !Number.isFinite(Number(order.total_amount))) {
        throw new Error('The saved order is incomplete. Please contact the shop.');
      }
      document.getElementById('order-number').textContent = String(order.order_id);
      document.getElementById('order-status').textContent = order.status;
      document.getElementById('order-total').textContent = Number(order.total_amount).toFixed(2);
      const items = document.getElementById('order-items');
      items.replaceChildren();
      for (const item of order.order_item) {
        const row = document.createElement('p');
        row.textContent = (item.product?.name || 'Product') + ' × ' + item.quantity + ' — AED ' + (Number(item.unit_price) * item.quantity).toFixed(2);
        items.appendChild(row);
      }
      message.textContent = 'Your order has been saved successfully.';
      document.getElementById('order-details').hidden = false;
    } catch (error) {
      message.textContent = error.message || 'Unable to load the order. Please try again.';
    }
  }
  loadConfirmation();
})();
