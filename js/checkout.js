const SUPABASE_URL = "https://cwlzsjbzxsbpkokgnlhr.supabase.co/";
const SUPABASE_KEY = "sb_publishable_PEWlEp2pD8obpUe9S8NFpA_AhZU8qF7";
(() => {
'use strict';
const CART_KEY = 'shopnow_cart';
const REQUEST_KEY = 'shopnow_checkout_request';
const form = document.getElementById('checkout-form');
const button = document.getElementById('place-order');
const itemsBox = document.getElementById('checkout-items');
const totalBox = document.getElementById('checkout-total');
const message = document.getElementById('checkout-message');
message.setAttribute('role','status');
message.setAttribute('aria-live','polite');
let cart = [], busy = false, storageReady = true;
const money = n => (Math.round((Number(n) + Number.EPSILON)*100)/100).toFixed(2);
function readCart() {
 const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
 if (!Array.isArray(saved) || saved.length > 100 || saved.some(i => !i || !Number.isSafeInteger(Number(i.id)) || Number(i.id)<1 || !Number.isInteger(i.quantity) || i.quantity<1 || i.quantity>999 || !Number.isFinite(Number(i.price)) || Number(i.price)<0) || new Set(saved.map(i=>Number(i.id))).size!==saved.length) throw new Error('Your cart could not be read. Please return to Products and rebuild it.');
 return saved;
}
function render() {
 itemsBox.replaceChildren();
 let cents = 0;
 for (const item of cart) {
  const row = document.createElement('p');
  const line = Math.round(Number(item.price)*100)*item.quantity;
  cents += line;
  row.textContent = String(item.name || 'Product') + ' × ' + item.quantity + ' — AED ' + (line/100).toFixed(2);
  itemsBox.appendChild(row);
 }
 totalBox.textContent = (cents/100).toFixed(2);
 button.disabled = busy || !storageReady || cart.length === 0;
 if (!cart.length) itemsBox.textContent = 'Your cart is empty. Add products before checking out.';
}
try { cart = readCart(); } catch(e) { storageReady=false; message.textContent=e.message; }
render();
window.addEventListener('storage', e => {
 if (e.key !== CART_KEY || busy) return;
 try {cart=readCart(); storageReady=true; message.textContent='Your cart has been updated.';} catch(err) {storageReady=false; message.textContent=err.message;}
 render();
});
form.addEventListener('submit', async event => {
 event.preventDefault();
 if (busy || !storageReady) return;
 if (!form.reportValidity()) return;
 const value = id => document.getElementById(id).value.trim();
 const customer = {p_customer_name:value('customer-name'),p_email:value('customer-email').toLowerCase(),p_phone:value('customer-phone'),p_address:value('customer-address')};
 if (!customer.p_customer_name || customer.p_customer_name.length>150 || customer.p_email.length>150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.p_email) || customer.p_phone.length<3 || customer.p_phone.length>30 || customer.p_address.length<5 || customer.p_address.length>1000) {message.textContent='Please enter a valid name, email, phone number, and delivery address.'; return;}
 let submitted;
 try {submitted=readCart();} catch(e) {message.textContent=e.message; return;}
 if (!submitted.length) {cart=[]; render(); return;}
 const fingerprint = JSON.stringify({customer,items:submitted.map(i=>({product_id:Number(i.id),quantity:i.quantity}))});
 let request;
 try {
  request=JSON.parse(sessionStorage.getItem(REQUEST_KEY) || 'null');
  if (!request || request.fingerprint!==fingerprint) {request={fingerprint,id:crypto.randomUUID()}; sessionStorage.setItem(REQUEST_KEY,JSON.stringify(request));}
 } catch(e) {message.textContent='Please enable browser storage before placing an order.'; return;}
 busy=true; render(); button.textContent='Placing order…'; message.textContent='Saving your order…';
 try {
  const response=await fetch(SUPABASE_URL.replace(/\/$/,'')+'/rest/v1/rpc/shopnow_checkout',{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_request_id:request.id,...customer,p_items:submitted.map(i=>({product_id:Number(i.id),quantity:i.quantity}))})});
  const result=await response.json();
  if (!response.ok) {
   if (result.code==='PGRST202') throw new Error('Order saving is not set up yet. Your cart has been kept.');
   if (response.status===401 || response.status===403) throw new Error('Order saving is currently unavailable. Your cart has been kept.');
   throw new Error(result.code==='P0001' ? result.message : 'Your order could not be saved. Your cart has been kept. Please try again.');
  }
  if (!result || !result.order_id || !Number.isFinite(Number(result.total_amount))) throw new Error('The server did not confirm the order. Please retry; the same request will be reused.');
  let cleared=false;
  try {if (JSON.stringify(readCart())===JSON.stringify(submitted)) {localStorage.removeItem(CART_KEY); cart=[]; cleared=true;} else {cart=readCart();}} catch(e) {storageReady=false;}
  if (cleared) { try { sessionStorage.removeItem(REQUEST_KEY); } catch(e) {} }
  render();
  message.textContent='Order #'+result.order_id+' placed successfully. Total: AED '+money(result.total_amount)+'.'+(cleared?'':' Your changed cart has been kept.');
  form.reset();
 } catch(e) {message.textContent=e.message==='Failed to fetch'?'Connection failed. Your cart has been kept. Retry to check or complete the same order.':e.message;}
 finally {busy=false; button.textContent='Place Order'; render();}
});
})();
