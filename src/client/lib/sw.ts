/**
 * Service Worker がこのページを制御し始めるのを待つ上限。初回は画面のファイルを保存してから制御を始めるため、
 * 少しかかる。通信が遅くて待ちきれないときは、保存されないまま読み取りの準備を始める（次に開いたときに保存する）。
 */
const CONTROL_TIMEOUT_MS = 10_000;

/**
 * Service Worker を登録し、このページを制御し始めるまで待つ。
 * 文字認識のモデルの取得はこのあとに始める。先に取得すると、その通信が保存されないため。
 */
export async function startServiceWorker(): Promise<void> {
  // 開発サーバーでは使わない（保存したファイルが、変更を確かめるのを邪魔するため）
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (err) {
    console.error("Service Worker を登録できませんでした", err);
    return;
  }
  if (navigator.serviceWorker.controller) return;
  await new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
    setTimeout(resolve, CONTROL_TIMEOUT_MS);
  });
}
