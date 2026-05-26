/**
 * Email Service — Placeholder / Mock
 *
 * Integrasi nanti dengan EmailJS, SendGrid, atau Firebase Cloud Functions.
 * Cukup ganti body fungsi di bawah dengan provider email sesungguhnya.
 */

const logEmail = (to, subject, body) => {
  console.log(`%c[EMAIL SERVICE]`, 'color:#6366f1;font-weight:bold');
  console.log(`  To      : ${to}`);
  console.log(`  Subject : ${subject}`);
  console.log(`  Body    : ${body}`);
  console.log('──────────────────────────────');
};

export const sendEmail = async ({ to, subject, body }) => {
  logEmail(to, subject, body);
  return { success: true, message: 'Email logged (mock mode)' };
};

export default {
  sendEmail,
};
