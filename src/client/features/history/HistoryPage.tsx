import { css } from "styled-system/css";
import { AppShell } from "../../components/AppShell.tsx";
import { TopBar } from "../../components/TopBar.tsx";
import { RETENTION_DAYS, useReadings, useReadingsLoaded } from "../../lib/readings.ts";
import { navigate } from "../../lib/router.ts";
import { ReadingCard } from "./ReadingCard.tsx";

/** これまでのスキャンの一覧（新しい順）。削除は、それぞれの結果の画面の「⋯」から行う。 */
export function HistoryPage() {
  const readings = useReadings();
  const loaded = useReadingsLoaded();
  return (
    <AppShell
      header={
        <TopBar
          title="これまでのスキャン"
          back={{ label: "トップへ戻る", onClick: () => navigate({ name: "top" }) }}
        />
      }
    >
      <div className={css({ display: "grid", gap: "2.5", p: "4" })}>
        <p className={css({ fontSize: "sm", color: "fg.muted" })}>
          スキャンした内容は、この端末の中のみに保存します。{RETENTION_DAYS}
          日たつと自動で削除します。
        </p>
        {loaded && readings.length === 0 && (
          <p className={css({ py: "8", textAlign: "center", color: "fg.muted" })}>
            スキャンはまだありません。
          </p>
        )}
        <ul className={css({ display: "grid", gap: "2.5" })}>
          {readings.map((r) => (
            <ReadingCard key={r.id} reading={r} />
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
