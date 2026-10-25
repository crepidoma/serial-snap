import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { AppShell } from "../../components/AppShell.tsx";
import { Phrases } from "../../components/Phrases.tsx";
import { HelpButton, TopBar } from "../../components/TopBar.tsx";
import { RETENTION_DAYS } from "../../lib/readings.ts";
import { goBack } from "../../lib/router.ts";

function Section({ title, children }: { title: string | string[]; children: ReactNode }) {
  return (
    <section
      className={css({
        display: "grid",
        gap: "1.5",
        p: "4",
        bg: "bg.surface",
        borderWidth: "1px",
        borderColor: "border",
        borderRadius: "lg",
      })}
    >
      <h2 className={css({ fontSize: "md", fontWeight: "bold" })}>
        {typeof title === "string" ? title : <Phrases>{title}</Phrases>}
      </h2>
      {children}
    </section>
  );
}

/** このアプリについて。非公式であること、送らないこと、消えること、免責、書体のライセンス、版。 */
export function AboutPage() {
  return (
    <AppShell
      header={
        <TopBar
          title="このアプリについて"
          back={{ label: "戻る", onClick: goBack }}
          actions={<HelpButton />}
        />
      }
    >
      <div className={css({ display: "grid", gap: "3", p: "4" })}>
        <Section title="非公式のツールです">
          <p>
            応募サイトの運営・レーベル・アーティストとは関係ありません。応募サイトの仕様が変わると、使えなくなる場合があります。
          </p>
        </Section>
        <Section title={["写真もシリアルナンバーも", "端末の外へ送りません"]}>
          <p>
            文字の読み取りは端末の中で行います。結果は、この端末のブラウザのみに保存します。通信は、初回のダウンロード(約31MB)のみです。
          </p>
        </Section>
        <Section title={`スキャンは${RETENTION_DAYS}日で消えます`}>
          <p>
            スキャンは1回ごとに保存し、{RETENTION_DAYS}
            日後に自動で削除します。写真そのものは保存せず、シリアルナンバーの切り抜きのみ残します。
          </p>
        </Section>
        <Section title="読み取りの誤りについて">
          <p>
            読み取りは間違えることがあります。登録の前に、必ず紙と見比べてください。登録ボタンは、このアプリでは押しません。
          </p>
          <p>
            読み取りの誤りや、それによる損害(登録の失敗、アカウントの一時停止など)について、作者は責任を負いかねます。
          </p>
        </Section>
        <div
          className={css({ display: "grid", gap: "1", px: "1", fontSize: "sm", color: "fg.muted" })}
        >
          <p>シリアルナンバーの表示に、IBM Plex Mono(SIL OFL 1.1)を使用しています。</p>
          <p>バージョン {__BUILD_DATE__}</p>
        </div>
      </div>
    </AppShell>
  );
}
