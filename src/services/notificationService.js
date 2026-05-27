/**
 * Notification Service — Trigger & Deadline Checker
 *
 * Siap diintegrasikan dengan layanan notifikasi nantinya.
 */

// ─── TRIGGER 1: User mengajukan booking ──────────────────────────────────────
export const onBookingSubmitted = async (booking, user) => {
  return { trigger: 'booking_submitted', bookingId: booking.id };
};

// ─── TRIGGER 2: Admin approve / reject ────────────────────────────────────────
export const onBookingStatusChanged = async (booking, userEmail, newStatus) => {
  return { trigger: 'booking_status_changed', bookingId: booking.id, newStatus };
};

// ─── DEADLINE CHECKER (3 Hari) ────────────────────────────────────────────────
export const getDeadlineInfo = (approvedAt) => {
  if (!approvedAt) return null;

  const approvalDate =
    approvedAt?.toDate ? approvedAt.toDate() : new Date(approvedAt);
  const now = new Date();
  const diffMs = now - approvalDate;
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysRemaining = 3 - daysSince;

  if (daysSince < 0) {
    return { level: 'normal', message: 'Masa pengambilan belum dimulai' };
  }
  if (daysRemaining === 3) {
    return { level: 'normal', message: `Sisa ${daysRemaining} hari untuk mengambil` };
  }
  if (daysRemaining === 2) {
    return { level: 'warning', message: 'Sisa 2 hari. Segera ambil barang.' };
  }
  if (daysRemaining === 1) {
    return { level: 'urgent', message: 'Sisa 1 hari! Ambil barang besok.' };
  }
  if (daysRemaining === 0 || daysSince === 2) {
    return { level: 'critical', message: 'Hari terakhir! Ambil barangmu sekarang!' };
  }
  if (daysSince >= 3) {
    return { level: 'overdue', message: 'TERLAMBAT — Hubungi admin segera.' };
  }

  return { level: 'normal', message: `Sisa ${daysRemaining} hari` };
};

// ─── REMINDER LOG (hooks for Cloud Functions nanti) ──────────────────────────
export const checkDeadlinesAndNotify = async (approvedBookings) => {
  const notifications = [];

  for (const booking of approvedBookings) {
    const info = getDeadlineInfo(booking.approvedAt);
    if (!info) continue;

    if (info.level === 'critical' && !booking.notifiedDay3) {
      notifications.push({
        bookingId: booking.id,
        message: info.message,
        shouldNotify: true,
      });
    } else if (info.level === 'urgent' && !booking.notifiedDay2) {
      notifications.push({
        bookingId: booking.id,
        message: info.message,
        shouldNotify: true,
      });
    } else if (info.level === 'warning' && !booking.notifiedDay1) {
      notifications.push({
        bookingId: booking.id,
        message: info.message,
        shouldNotify: true,
      });
    }
  }

  return notifications;
};
