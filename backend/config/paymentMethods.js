// Replace these demo values with verified BalochHunar platform accounts before accepting payments.
const paymentMethods = [
  {
    method: 'Bank Transfer',
    accountName: 'Shah Jan',
    accountNumber: 'DEMO-BANK-7846391256',
    details: 'Demo bank account placeholder. Confirm the bank name and IBAN before publishing.'
  },
  {
    method: 'JazzCash',
    accountName: 'Shah Jan',
    accountNumber: '0300-7418265',
    details: 'Demo JazzCash number. Replace it with the verified BalochHunar wallet number.'
  },
  {
    method: 'EasyPaisa',
    accountName: 'Shah Jan',
    accountNumber: '0312-5864079',
    details: 'Demo EasyPaisa number. Replace it with the verified BalochHunar wallet number.'
  },
  {
    method: 'Other',
    accountName: 'Shah Jan',
    accountNumber: 'DEMO-OTHER-5639082174',
    details: 'Demo alternate payment reference. Add the verified method instructions before use.'
  }
];

module.exports = paymentMethods;
