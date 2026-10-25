/**
 * 読み取りの準備（モデルの取得と初期化）に失敗した理由を、画面に出す短い言葉にする。
 * Workerから届くエラーの文をそのまま見せても分からないため、よくある場合だけ言い換える。
 */
export function describeModelError(message: string): string {
  // fetch の失敗はブラウザごとに文が違う（Chrome: Failed to fetch・network error、Safari: Load failed、
  // Firefox: NetworkError）。端末に保存したデータもなく通信もできないときに起きる
  if (/failed to fetch|network ?error|load failed/i.test(message)) return "通信できませんでした";
  // src/ocr/worker.ts の fetchWithProgress が、HTTPの状態を括弧に入れて投げる
  const status = /（(\d{3})）/.exec(message)?.[1];
  if (status) return `データを取得できませんでした(HTTP ${status})`;
  return "データを読み込めませんでした";
}
