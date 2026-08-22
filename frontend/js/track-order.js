const money = value => `PKR ${Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function showError(message) { const el = document.getElementById('track-error'); el.textContent = message; el.classList.remove('hidden'); }
async function loadTrackedOrder() {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get('order_number');
  const token = params.get('token');
  if (!orderNumber || !token) throw new Error('This private tracking link is incomplete.');
  const response = await API.get(`/orders/track/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`);
  const order = response.data;
  document.getElementById('order-number').textContent = order.order_number;
  document.getElementById('order-date').textContent = `Placed ${new Date(order.created_at).toLocaleString()}`;
  document.getElementById('order-status').textContent = order.order_status;
  document.getElementById('payment-status').textContent = `Payment: ${order.payment_status} via ${order.payment_method}`;
  document.getElementById('order-subtotal').textContent = money(order.subtotal);
  document.getElementById('order-delivery').textContent = money(order.delivery_charges);
  document.getElementById('order-total').textContent = money(order.total_amount);
  document.getElementById('order-courier').textContent = order.courier_name ? `${order.courier_name}${order.tracking_number ? ` (${order.tracking_number})` : ''}` : 'Not assigned';
  document.getElementById('order-items').innerHTML = order.items.map(item => `<div class="flex items-center justify-between gap-3"><div class="flex items-center gap-3"><img src="${item.product_image || ''}" class="w-12 h-12 object-cover rounded-lg" alt=""><span class="text-sm font-semibold">${escapeHtml(item.product_name)}</span></div><span class="text-xs">${item.quantity} × ${money(item.product_price)}</span></div>`).join('');
  document.getElementById('timeline').innerHTML = order.history.map(item => `<li class="flex gap-3"><span class="w-2.5 h-2.5 mt-1.5 rounded-full bg-terracotta flex-shrink-0"></span><div><strong class="text-sm">${escapeHtml(item.new_status)}</strong><span class="block text-[11px] text-gray-500">${new Date(item.created_at).toLocaleString()}${item.notes ? ` · ${escapeHtml(item.notes)}` : ''}</span></div></li>`).join('');
  document.getElementById('track-card').classList.remove('hidden');
}
function escapeHtml(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
document.addEventListener('DOMContentLoaded', () => loadTrackedOrder().catch(error => showError(error.message || 'Unable to load order.')));
