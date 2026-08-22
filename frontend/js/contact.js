/**
 * BalochHunar — Contact Form Submission Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Pre-fill Subject if passed via URL parameters (e.g. from Product Quick View or Services Page)
  const urlParams = new URLSearchParams(window.location.search);
  const subjectParam = urlParams.get('subject');
  if (subjectParam) {
    const subjectInput = document.getElementById('contact-subject');
    if (subjectInput) subjectInput.value = subjectParam;
  }

  const form = document.getElementById('public-contact-form');
  const successAlert = document.getElementById('form-success');
  const successText = document.getElementById('form-success-text');
  const submitBtn = document.getElementById('contact-submit-btn');
  const btnText = document.getElementById('contact-btn-text');
  const btnSpinner = document.getElementById('contact-btn-spinner');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    // Client-side validation
    if (!name || !email || !subject || !message) {
      API.showToast('Please fill out all required fields.', 'error');
      return;
    }

    if (message.length < 10) {
      API.showToast('Please provide a message with at least 10 characters.', 'error');
      return;
    }

    // Set Loading UI
    submitBtn.disabled = true;
    btnText.textContent = 'Transmitting Inquiry...';
    btnSpinner.classList.remove('hidden');
    successAlert.classList.add('hidden');

    try {
      const res = await API.post('/messages', {
        name,
        email,
        phone: phone || null,
        subject,
        message
      });

      if (res.success) {
        successText.textContent = res.message || 'Thank you! Your inquiry has been saved successfully in our system.';
        successAlert.classList.remove('hidden');
        API.showToast('Inquiry submitted successfully!', 'success');
        form.reset();
      }
    } catch (error) {
      API.showToast(error.message || 'Could not send your inquiry. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Submit Inquiry';
      btnSpinner.classList.add('hidden');
    }
  });
});
