import { useEffect, useState } from "react";
import { css, cx } from "styled-system/css";
import { AppShell } from "../../components/AppShell.tsx";
import { Button } from "../../components/Button.tsx";
import { Icon, type IconName } from "../../components/Icon.tsx";
import { AppBar } from "../../components/TopBar.tsx";
import { describeModelError } from "../../lib/modelError.ts";
import { type ModelStatus, useModelStatus } from "../../lib/ocr.ts";
import { navigate } from "../../lib/router.ts";
import {
  cancelScan,
  currentFound,
  missingPhotos,
  type PhotoState,
  photoRatio,
  type ScanJob,
  useScanJob,
} from "../../lib/scanJob.ts";
import { usePhotoInputs } from "./PhotoPicker.tsx";
import { PhotoViewer } from "./PhotoViewer.tsx";
import { Body, card, h1, muted, PhotoPreview, Summary } from "./Summary.tsx";

/**
 * 読み取り中の写真で、今していること。文字の行を探す間（約2秒）は件数が増えないため、
 * 止まっていないと分かるように段階を言葉で出す。行の向きの補正は、文字の認識の中で1行ずつ行う。
 */
function stageText(current: ScanJob["current"], model: ModelStatus): string {
  // 文字認識のモデルの読み込みが終わるまで、Workerは写真を受け取ったまま待つ
  if (model.kind === "loading" && (!current || current.stage === "prepare")) {
    return `文字を読み取る準備をしています(${Math.round(model.progress * 100)}%)`;
  }
  switch (current?.stage) {
    case undefined:
    case "prepare":
      return "写真を読み込んでいます";
    case "detect":
      return "文字のある場所を探しています";
    case "large":
      return `文字を読み取っています(${current.done}/${current.total}行)`;
    case "rest":
      return `ほかの文字も読み取っています(${current.done}/${current.total}行)`;
    case "finish":
      return "応募先を確かめています";
  }
}

/** 読み取り中の画面。終わったあと、そのまま結果へ移らなかった場合はまとめを出す。 */
export function ScanPage() {
  const job = useScanJob();
  useEffect(() => {
    // 読み取りの途中で再読み込みした場合など。続きはないため、トップへ戻す
    if (!job) navigate({ name: "top" }, { replace: true });
  }, [job]);
  if (!job) return null;
  if (job.modelFailed) return <ModelFailed />;
  if (!job.finished || job.cancelled) return <Progress job={job} />;
  const missing = missingPhotos(job);
  // 一部の写真から読めた、または開けない写真があったときは、どの写真から見つからなかったかを出す。
  // どの写真からも見つからなかったときは、撮り直しのコツを出す
  if (job.failed.length > 0 || (job.added > 0 && missing.length > 0)) {
    return <PhotoMissing job={job} missing={missing} />;
  }
  return <Empty />;
}

function Bar({ ratio, label, thick = false }: { ratio: number; label: string; thick?: boolean }) {
  const pct = Math.round(ratio * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={css({
        h: thick ? "3.5" : "1.5",
        bg: "bg.sunken",
        borderRadius: "full",
        overflow: "hidden",
      })}
    >
      <div
        className={css({
          h: "full",
          bg: "accent",
          borderRadius: "full",
          // 段階の切り替わりで幅が飛ぶのを、滑らかに見せる
          transition: "[width 0.3s linear]",
        })}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Progress({ job }: { job: ScanJob }) {
  const total = job.photos.length;
  const index = job.photos.findIndex((p) => p.status === "reading");
  const doneCount = job.photos.filter((p) => p.status === "done" || p.status === "failed").length;
  const model = useModelStatus();
  // 文字の行の検出の間は途中経過が届かないため、時刻で進み具合を更新し続ける
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);
  const current = index >= 0 ? photoRatio(job.current, now) : 0;
  const ratio = (doneCount + current) / total;
  const found =
    job.photos.reduce((n, p) => n + (p.status === "done" ? p.count : 0), 0) +
    (index >= 0 ? currentFound(job.current) : 0);

  return (
    <AppShell
      header={<AppBar />}
      footer={
        <div className={css({ display: "grid", gap: "2.5" })}>
          <p
            className={css({
              display: "flex",
              gap: "2.5",
              p: "3",
              borderRadius: "md",
              bg: "accent.subtle",
              fontSize: "sm",
              "& > svg": { flex: "none", color: "accent.text" },
            })}
          >
            <Icon name="history" />
            <span>画面を閉じずにお待ちください。1枚あたり数秒〜十数秒かかります。</span>
          </p>
          <Button onClick={cancelScan} disabled={job.cancelled}>
            {job.cancelled ? "中止しています…" : "中止"}
          </Button>
        </div>
      }
    >
      <Body>
        <div role="status" className={css({ display: "grid", gap: "3" })}>
          <h1 className={h1}>
            スキャン中
            <WorkingDots />
          </h1>
          <div
            className={css({
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            })}
          >
            <span className={css({ fontSize: "xl", fontWeight: "bold" })}>
              {total}枚中 {Math.min(doneCount + 1, total)}枚目
            </span>
            <span className={muted}>見つかったシリアルナンバー {found}件</span>
          </div>
          <Bar ratio={ratio} label="全体の進み具合" thick />
        </div>
        <ul
          className={css({
            bg: "bg.surface",
            borderWidth: "1px",
            borderColor: "border",
            borderRadius: "lg",
          })}
        >
          {job.photos.map((p, i) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: 写真の順番は変わらない
              key={i}
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "3",
                p: "3",
                "&:not(:first-child)": { borderTopWidth: "1px", borderColor: "border" },
              })}
            >
              <div className={css({ flex: "1", minW: "0", display: "grid", gap: "1.5" })}>
                <div className={css({ display: "flex", justifyContent: "space-between" })}>
                  <b>{i + 1}枚目</b>
                  {p.status === "reading" && total > 1 && <b>{Math.round(current * 100)}%</b>}
                </div>
                {/* 1枚だけのときは全体のバーと同じになるため、写真ごとのバーは出さない */}
                {p.status === "reading" && total > 1 && (
                  <Bar ratio={current} label={`${i + 1}枚目の進み具合`} />
                )}
                <span className={muted}>
                  {p.status === "done"
                    ? p.count > 0
                      ? `${p.count}件見つかりました`
                      : "見つかりませんでした"
                    : p.status === "reading"
                      ? stageText(job.current, model)
                      : p.status === "failed"
                        ? "開けませんでした"
                        : "待機中"}
                </span>
              </div>
              {p.status === "done" && <StatusBadge tone="ok" icon="check" text="完了" />}
              {p.status === "failed" && <StatusBadge tone="warn" icon="warn" text="失敗" />}
            </li>
          ))}
        </ul>
      </Body>
    </AppShell>
  );
}

/** 見出しの後ろの「...」。点を1つずつ出し、止まっていないことを示す。点が消えても幅は残す。 */
function WorkingDots() {
  const dot = css({ _motionReduce: { animation: "[none]" } });
  return (
    <span aria-hidden="true">
      <span className={cx(dot, css({ animation: "[dot1 1.6s infinite]" }))}>.</span>
      <span className={cx(dot, css({ animation: "[dot2 1.6s infinite]" }))}>.</span>
      <span className={cx(dot, css({ animation: "[dot3 1.6s infinite]" }))}>.</span>
    </span>
  );
}

function StatusBadge({ tone, icon, text }: { tone: "ok" | "warn"; icon: IconName; text: string }) {
  return (
    <span
      className={cx(
        css({
          flex: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "1",
          px: "2.5",
          py: "0.5",
          borderRadius: "full",
          fontSize: "xs",
          fontWeight: "bold",
        }),
        tone === "ok"
          ? css({ bg: "accent.subtle", color: "fg", "& > svg": { color: "accent.text" } })
          : css({ bg: "warn.subtle", color: "warn" }),
      )}
    >
      <Icon name={icon} size={16} />
      {text}
    </span>
  );
}

const TIPS = [
  "明るい場所で、影を入れない",
  "紙を平らにし、折れを伸ばす",
  "文字がはっきり読める距離まで近づく",
  "ピントが合ってから撮影",
];

function Empty() {
  const { openCamera, openFiles, inputs } = usePhotoInputs();
  return (
    <Summary
      icon="search"
      title={["シリアルナンバーが", "見つかりませんでした"]}
      lead="撮り直すと、読み取れる場合があります。"
      bottom={
        <>
          <Button variant="primary" size="lg" onClick={openCamera}>
            <Icon name="camera" />
            撮り直す
          </Button>
          <Button onClick={openFiles}>写真を選ぶ</Button>
          {inputs}
        </>
      }
    >
      <section aria-label="撮り直しのコツ" className={card}>
        <h2 className={css({ fontSize: "md", fontWeight: "bold" })}>撮り直しのコツ</h2>
        <ul className={css({ display: "grid", gap: "2.5" })}>
          {TIPS.map((t) => (
            <li
              key={t}
              className={css({
                display: "flex",
                gap: "2.5",
                "& > svg": { flex: "none", color: "accent.text" },
              })}
            >
              <Icon name="check" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>
    </Summary>
  );
}

/** 見つからなかった写真の、理由の見当と撮り直し方。理由を言い切らない書き方にする。 */
function missingReason(photo: PhotoState | undefined): string {
  if (photo?.status === "failed") {
    return "写真を開けませんでした。形式に対応していないか、壊れている可能性があります。";
  }
  switch (photo?.issue) {
    case "dark":
      return "暗いようです。明るい場所で撮り直してください。";
    case "blurry":
      return "ぼやけているようです。ピントを合わせて撮り直してください。";
    default:
      return "紙が写っていないか、文字が小さすぎる可能性があります。";
  }
}

/** シリアルナンバーが見つからなかった写真（開けなかった写真を含む）があったときのまとめ。 */
function PhotoMissing({ job, missing }: { job: ScanJob; missing: number[] }) {
  const { openCamera, openFiles, inputs } = usePhotoInputs();
  const [viewing, setViewing] = useState<number>();
  const total = job.photos.length;
  const okCount = total - missing.length;
  return (
    <Summary
      icon="warn"
      title={[
        `${total}枚中${missing.length}枚からは、`,
        "シリアルナンバーが",
        "見つかりませんでした",
      ]}
      lead={
        job.added > 0
          ? `ほかの${okCount}枚から、シリアルナンバーを${job.added}件読み取りました。`
          : "撮り直すと、読み取れる場合があります。"
      }
      bottom={
        job.added > 0 ? (
          <Button
            variant="primary"
            size="lg"
            onClick={() =>
              navigate({ name: "results", readingId: job.readingId }, { replace: true })
            }
          >
            読み取れた{job.added}件を見る
          </Button>
        ) : (
          // 撮り直した写真は新しい読み取りになる（この画面の写真を差し替えるのではない）。
          // 読めた写真がないときだけ、0件の画面と同じく撮り直しの入口を置く
          <>
            <Button variant="primary" size="lg" onClick={openCamera}>
              <Icon name="camera" />
              撮り直す
            </Button>
            <Button onClick={openFiles}>写真を選ぶ</Button>
            {inputs}
          </>
        )
      }
    >
      <section aria-label="シリアルナンバーが見つからなかった写真" className={card}>
        <ul className={css({ display: "grid", gap: "3" })}>
          {missing.map((i) => (
            <li key={i} className={css({ display: "flex", alignItems: "center", gap: "3" })}>
              <PhotoPreview
                blob={job.photos[i]?.preview}
                label={`${i + 1}枚目の写真`}
                onOpen={job.photos[i]?.file ? () => setViewing(i) : undefined}
              />
              <div className={css({ flex: "1", minW: "0", display: "grid", gap: "0.5" })}>
                <b>{i + 1}枚目の写真</b>
                <span className={muted}>{missingReason(job.photos[i])}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <PhotoViewer
        file={viewing === undefined ? undefined : job.photos[viewing]?.file}
        label={`${(viewing ?? 0) + 1}枚目の写真`}
        onClose={() => setViewing(undefined)}
      />
    </Summary>
  );
}

const RETRY_STEPS = [
  "Wi-Fiやモバイル通信の接続を確認",
  "下の「開き直す」を押す",
  // 保存したデータがあっても、ブラウザがこのページの古い状態を持ったままだと読めないことがあった（iPhoneのSafari）
  "直らない場合は、ブラウザ(Safariなど)をいったん終了して開き直す",
];

/** 文字認識のモデル（約31MB）を読み込めなかったときの画面。 */
function ModelFailed() {
  const model = useModelStatus();
  return (
    <Summary
      icon="offline"
      tone="danger"
      title={["スキャンの準備に", "失敗しました"]}
      lead="スキャンに必要なデータ(約31MB)をダウンロードできませんでした。写真やシリアルナンバーは送信していません。"
      backToTop={false}
      bottom={
        <>
          <Button variant="primary" size="lg" onClick={() => location.reload()}>
            <Icon name="reload" />
            開き直す
          </Button>
          <p className={cx(muted, css({ fontSize: "xs", textAlign: "center" }))}>
            ダウンロードが必要なのは初回のみです。
          </p>
        </>
      }
    >
      <section aria-label="試してほしいこと" className={card}>
        <h2 className={css({ fontSize: "md", fontWeight: "bold" })}>次の順で試してください</h2>
        <ol className={css({ display: "grid", gap: "2.5" })}>
          {RETRY_STEPS.map((step, i) => (
            <li key={step} className={css({ display: "flex", alignItems: "center", gap: "2.5" })}>
              <span
                className={css({
                  flex: "none",
                  w: "6",
                  h: "6",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "full",
                  bg: "accent.subtle",
                  color: "accent.text",
                  fontSize: "sm",
                  fontWeight: "bold",
                })}
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
      {model.kind === "error" && (
        // 問い合わせや原因の確認に使えるよう、元の文も小さく添える
        <p className={cx(muted, css({ fontSize: "xs" }))}>
          原因: {describeModelError(model.reason)}
          <span className={css({ display: "block", wordBreak: "break-all" })}>
            ({model.reason})
          </span>
        </p>
      )}
    </Summary>
  );
}
