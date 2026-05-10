/**
 * QR payloads for attendance: hardware scanners typically paste text into a focused field.
 * Format UCSERP|<mongoObjectId> — readable and unambiguous vs random JSON.
 */

export const ATTENDANCE_QR_PREFIX = 'UCSERP|';

export function encodeAttendanceQr(studentMongoId) {
  return `${ATTENDANCE_QR_PREFIX}${String(studentMongoId)}`;
}

export function decodeAttendanceQr(raw) {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;

  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t);
      const id = j.studentId;
      if (id && /^[a-fA-F0-9]{24}$/.test(String(id))) return String(id);
    } catch {
      /* ignore */
    }
    return null;
  }

  if (t.startsWith(ATTENDANCE_QR_PREFIX)) {
    const id = t.slice(ATTENDANCE_QR_PREFIX.length).trim();
    if (/^[a-fA-F0-9]{24}$/.test(id)) return id;
    return null;
  }

  if (/^[a-fA-F0-9]{24}$/.test(t)) return t;
  return null;
}
