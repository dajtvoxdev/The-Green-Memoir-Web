const VN_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getVietnamDateKey(date: Date = new Date()): string {
  return VN_DATE_FORMATTER.format(date);
}
