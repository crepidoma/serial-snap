import { css } from "styled-system/css";
import { AppShell } from "../../components/AppShell.tsx";
import { Button } from "../../components/Button.tsx";
import { Icon } from "../../components/Icon.tsx";
import { AppBar, HeaderActions, PrivacyBand } from "../../components/TopBar.tsx";
import { useReadings, useReadingsLoaded } from "../../lib/readings.ts";
import { navigate } from "../../lib/router.ts";
import { ReadingCard } from "../history/ReadingCard.tsx";
import { ModelStatusBand } from "../scan/ModelStatusBand.tsx";
import { PhotoPicker } from "../scan/PhotoPicker.tsx";

/** トップに並べる、これまでのスキャンの件数。すべては「すべて見る」の一覧で見る。 */
const RECENT_COUNT = 3;

/** 初回（スキャンがまだないとき）の「はじめての方へ」。使い方を開く。 */
function FirstTimeCard() {
  return (
    <button
      type="button"
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "3",
        w: "full",
        py: "3.5",
        pl: "4",
        pr: "3",
        bg: "bg.surface",
        borderWidth: "1px",
        borderColor: "border",
        borderRadius: "lg",
        textAlign: "left",
        _hoverable: { _hover: { bg: "bg.sunken" } },
      })}
      onClick={() => navigate({ name: "howto" })}
    >
      <span
        className={css({
          flex: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          w: "12",
          h: "12",
          borderRadius: "full",
          bg: "accent.subtle",
          color: "accent.text",
        })}
      >
        <Icon name="play" />
      </span>
      <span className={css({ flex: "1", display: "grid" })}>
        <b>はじめての方へ</b>
        <span className={css({ fontSize: "sm", color: "fg.muted" })}>使い方を見る(約1分)</span>
      </span>
      <span className={css({ display: "inline-flex", color: "fg.muted" })}>
        <Icon name="chevronRight" />
      </span>
    </button>
  );
}

/** トップ。何のツールかと、「撮る」「写真を選ぶ」、はじめての方へ、これまでのスキャン。 */
export function TopPage() {
  const readings = useReadings();
  const loaded = useReadingsLoaded();

  return (
    <AppShell
      header={
        <>
          <AppBar actions={<HeaderActions />} heading />
          <PrivacyBand />
        </>
      }
    >
      <div className={css({ display: "grid", gap: "4", p: "4" })}>
        <div className={css({ display: "grid", gap: "2.5" })}>
          <PhotoPicker />
          <ModelStatusBand />
        </div>
        {loaded && readings.length === 0 && <FirstTimeCard />}
        {readings.length > 0 && (
          <section aria-label="これまでのスキャン" className={css({ display: "grid", gap: "2.5" })}>
            <div
              className={css({
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              })}
            >
              <h2 className={css({ fontSize: "md", fontWeight: "bold" })}>これまでのスキャン</h2>
              <Button
                variant="ghost"
                size="sm"
                className={css({ pr: "0" })}
                onClick={() => navigate({ name: "history" })}
              >
                すべて見る
                <Icon name="chevronRight" size={18} />
              </Button>
            </div>
            <ul className={css({ display: "grid", gap: "2.5" })}>
              {readings.slice(0, RECENT_COUNT).map((r) => (
                <ReadingCard key={r.id} reading={r} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
