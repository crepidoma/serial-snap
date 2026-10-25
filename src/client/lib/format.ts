function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function clock(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 日時を `2026/10/11 21:40:05` の形にする。スマホの狭い幅に収めるため、曜日は出さない。
 * スキャンは同じ日に何度も行うことがあるため、秒まで出して見分けられるようにする。
 */
export function formatDateTime(time: number): string {
  const d = new Date(time);
  const day = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
  return `${day} ${clock(d)}`;
}

/**
 * `formatDateTime` と同じ形で、今日なら日付を省いて `今日 21:40:05` とする。
 * 行の中の注意など、いつのことかを短く伝えたいところで使う（ヘッダーなど日時そのものを示す所では使わない）。
 */
export function formatRecentDateTime(time: number, now = Date.now()): string {
  const d = new Date(time);
  return d.toDateString() === new Date(now).toDateString()
    ? `今日 ${clock(d)}`
    : formatDateTime(time);
}
