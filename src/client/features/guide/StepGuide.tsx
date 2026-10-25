import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";
import { AppShell, column } from "../../components/AppShell.tsx";
import { Button } from "../../components/Button.tsx";
import { Icon } from "../../components/Icon.tsx";
import { TopBar } from "../../components/TopBar.tsx";

/** 端末を切り替えるタブ。 */
export interface GuideTab<T extends string> {
  value: T;
  label: string;
}

/**
 * 1画面1ステップで進む案内の枠。上に題・（あれば）端末のタブ・何ステップ目か、下に「戻る」「次へ」を置く。
 * 最後のステップでは「次へ」の代わりに `doneLabel` のボタンを出す。`lastFooter` があれば、最後の帯はそれに置き換える。
 */
export function StepGuide<T extends string>({
  title,
  steps,
  step,
  onStep,
  onBack,
  onDone,
  doneLabel = "完了",
  tabs,
  tab,
  onTab,
  closeButton = false,
  lastFooter,
}: {
  title: string;
  steps: ReactNode[];
  /** 今のステップ（0から） */
  step: number;
  onStep: (step: number) => void;
  onBack: () => void;
  onDone: () => void;
  doneLabel?: string;
  tabs?: GuideTab<T>[];
  tab?: T;
  onTab?: (tab: T) => void;
  /** 左の戻るの代わりに、右に「閉じる」（×）を置く（全画面のダイアログとして開く使い方） */
  closeButton?: boolean;
  lastFooter?: ReactNode;
}) {
  const total = steps.length;
  const last = step >= total - 1;
  return (
    <AppShell
      header={
        <>
          {closeButton ? (
            <TopBar
              title={title}
              actions={
                <Button variant="plain" size="icon" aria-label="閉じる" onClick={onBack}>
                  <Icon name="close" />
                </Button>
              }
            />
          ) : (
            <TopBar title={title} back={{ label: "戻る", onClick: onBack }} />
          )}
          {tabs && onTab && (
            <div className={cx(column, css({ px: "4" }))}>
              <div
                role="tablist"
                aria-label="端末の選択"
                className={css({
                  display: "flex",
                  gap: "1",
                  p: "1",
                  borderRadius: "md",
                  bg: "bg.sunken",
                })}
              >
                {tabs.map((t) => {
                  const on = t.value === tab;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => onTab(t.value)}
                      className={css({
                        flex: "1",
                        minH: "10",
                        borderRadius: "sm",
                        fontSize: "sm",
                        fontWeight: "bold",
                        color: on ? "fg" : "fg.muted",
                        bg: on ? "bg.surface" : "transparent",
                        boxShadow: on ? "sm" : "[none]",
                      })}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div
            className={cx(
              column,
              css({
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: "4",
                py: "2.5",
              }),
            )}
          >
            <span className={css({ fontSize: "sm", fontWeight: "bold" })}>
              ステップ {step + 1} / {total}
            </span>
            <span aria-hidden="true" className={css({ display: "flex", gap: "1.5" })}>
              {steps.map((_, i) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: ステップの数と順番は変わらない
                  key={i}
                  className={css({
                    w: "2",
                    h: "2",
                    borderRadius: "full",
                    bg: i === step ? "accent" : "border.strong",
                  })}
                />
              ))}
            </span>
          </div>
        </>
      }
      footer={
        last && lastFooter ? (
          lastFooter
        ) : (
          <div className={css({ display: "flex", gap: "2.5" })}>
            {step > 0 && <Button onClick={() => onStep(step - 1)}>戻る</Button>}
            {last ? (
              <Button variant="primary" className={css({ flex: "1" })} onClick={onDone}>
                {doneLabel}
              </Button>
            ) : (
              <Button
                variant="primary"
                className={css({ flex: "1" })}
                onClick={() => onStep(step + 1)}
              >
                次へ
              </Button>
            )}
          </div>
        )
      }
    >
      <div className={css({ display: "grid", gap: "3.5", p: "4" })}>{steps[step]}</div>
    </AppShell>
  );
}
