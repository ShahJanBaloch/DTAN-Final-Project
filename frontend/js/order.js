let selectedProduct = null;
let deliveryCharges = 300;
let createdOrder = null;
let paymentMethods = [];

const money = value => `PKR ${Number(value || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const showError = message => { const el = document.getElementById('checkout-error'); el.textContent = message; el.classList.remove('hidden'); };

async function loadProduct() {
  const productId = new URLSearchParams(window.location.search).get('product_id');
  if (!productId || !/^\d+$/.test(productId)) throw new Error('Select a valid product from the catalog.');
  const response = await API.get(`/products/${productId}`);
  if (!response.success) throw new Error(response.message || 'Product could not be loaded.');
  selectedProduct = response.data;
  document.getElementById('product-name').textContent = selectedProduct.name;
  document.getElementById('product-price').textContent = money(selectedProduct.price);
  document.getElementById('product-image').src = selectedProduct.image;
  recalculate();
}

async function loadPaymentMethods() {
  const response = await API.get('/orders/payment-methods');
  paymentMethods = response.data || [];
  document.getElementById('payment-method').addEventListener('change', renderPaymentInstructions);
}

function renderPaymentInstructions() {
  const selected = paymentMethods.find(item => item.method === document.getElementById('payment-method').value);
  const container = document.getElementById('payment-instructions');
  if (!selected) {
    container.innerHTML = '<strong>Payment instructions</strong><p class="mt-1">Select a method to view the platform account details. Manual payments remain pending until BalochHunar verifies them.</p>';
    return;
  }
  container.innerHTML = `<strong>${selected.method} account</strong><p class="mt-1"><span class="font-semibold">Account name:</span> BalochHunar<br><span class="font-semibold">Account number:</span> ${selected.accountNumber}</p><p class="mt-2 text-amber-800"></p>`;
}

function recalculate() {
  if (!selectedProduct) return;
  const quantity = Math.max(1, Math.min(99, Number(document.getElementById('quantity').value) || 1));
  document.getElementById('quantity').value = quantity;
  const subtotal = Number(selectedProduct.price) * quantity;
  document.getElementById('subtotal').textContent = money(subtotal);
  document.getElementById('delivery').textContent = money(deliveryCharges);
  document.getElementById('total').textContent = money(subtotal + deliveryCharges);
}

async function submitOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = document.getElementById('submit-order');
  button.disabled = true;
  button.textContent = 'Submitting order...';
  try {
    const fields = Object.fromEntries(new FormData(form).entries());
    const response = await API.post('/orders', {
      ...fields,
      product_id: selectedProduct.id,
      quantity: Number(document.getElementById('quantity').value)
    });
    createdOrder = response.data;
    document.getElementById('success-message').textContent = `Order ${createdOrder.orderNumber} is ${createdOrder.orderStatus}. Total: ${money(createdOrder.totalAmount)}. Save your tracking link; payment verification is handled by BalochHunar administration.`;
    document.getElementById('track-link').href = `track-order.html?order_number=${encodeURIComponent(createdOrder.orderNumber)}&token=${encodeURIComponent(createdOrder.trackingToken)}`;
    document.getElementById('proof-panel').classList.remove('hidden');
    document.getElementById('order-success').classList.remove('hidden');
    form.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showError(error.message || 'Could not place order.');
  } finally {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-lock mr-2"></i>Place Secure Order';
  }
}

async function submitProof(event) {
  event.preventDefault();
  const form = document.getElementById('proof-form');
  const data = new FormData();
  data.append('tracking_token', createdOrder.trackingToken);
  data.append('transaction_reference', document.getElementById('proof-reference').value.trim());
  data.append('payment_proof', document.getElementById('proof-file').files[0]);
  try {
    const response = await API.upload(`/orders/track/${encodeURIComponent(createdOrder.orderNumber)}/payment-proof`, data);
    form.innerHTML = `<p class="text-emerald-800 font-semibold">${response.message}</p>`;
  } catch (error) { showError(error.message || 'Could not submit payment proof.'); }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('quantity').addEventListener('input', recalculate);
  document.getElementById('order-form').addEventListener('submit', submitOrder);
  document.getElementById('proof-form').addEventListener('submit', submitProof);
  try { await Promise.all([loadProduct(), loadPaymentMethods()]); } catch (error) { showError(error.message); document.getElementById('order-form').classList.add('hidden'); }
});
