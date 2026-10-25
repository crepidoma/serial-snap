import { cloneElement, type ReactElement, type ReactNode } from "react";
import { css, cx } from "styled-system/css";
import { Icon, type IconName } from "../../components/Icon.tsx";
import { Phrases } from "../../components/Phrases.tsx";

/** 案内の見出し。長い見出しは文節ごとの配列で渡し、狭い画面でも文節の区切りで折り返す。 */
export function StepTitle({ children }: { children: string | string[] }) {
  return (
    <h2 className={css({ fontSize: "xl", fontWeight: "bold", lineHeight: "snug" })}>
      {typeof children === "string" ? children : <Phrases>{children}</Phrases>}
    </h2>
  );
}

/** 案内の本文。 */
export function Lead({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <p className={css({ fontSize: muted ? "sm" : "md", color: muted ? "fg.muted" : "fg" })}>
      {children}
    </p>
  );
}

/** 端末の画面の図を囲む枠。 */
export function Shot({ children }: { children: ReactNode }) {
  return (
    <div
      className={css({
        display: "grid",
        gap: "2.5",
        p: "4",
        borderRadius: "lg",
        bg: "bg.sunken",
        borderWidth: "1px",
        borderColor: "border",
      })}
    >
      {children}
    </div>
  );
}

/** 図の説明の小さな見出し。 */
export function ShotCaption({ children }: { children: ReactNode }) {
  return (
    <span
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "1.5",
        fontSize: "xs",
        fontWeight: "bold",
        color: "fg.muted",
      })}
    >
      {children}
    </span>
  );
}

/** 図の中の、端末の画面の一部（ボタンの並びや一覧など）。 */
export function Mock({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      className={cx(
        css({
          borderRadius: "md",
          borderWidth: "1px",
          boxShadow: "sm",
          // 中の「ここを押す」の枠（外側に広がる影）を切らないよう、はみ出しは隠さない
        }),
        dark
          ? css({ bg: "fg", color: "bg.surface", borderColor: "fg" })
          : css({ bg: "bg.surface", color: "fg", borderColor: "border" }),
      )}
    >
      {children}
    </div>
  );
}

/** 図の中の一覧の1行。 */
export function MockRow({ children }: { children: ReactNode }) {
  return (
    <div
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "2.5",
        minH: "11",
        px: "3",
        // 「ここを押す」の枠が上下の行に重ならないよう、少し余白を取る
        py: "1.5",
        fontSize: "sm",
        "&:not(:first-child)": { borderTopWidth: "1px", borderColor: "border" },
      })}
    >
      {children}
    </div>
  );
}

/** 図の中の、アイコンが並んだ帯（Safariの下部など）。 */
export function MockToolbar({ icons, highlight }: { icons: IconName[]; highlight: number }) {
  return (
    <div
      className={css({
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        h: "[52px]",
        px: "2",
        color: "fg.muted",
      })}
    >
      {icons.map((name, i) =>
        i === highlight ? (
          <Highlight key={name}>
            <span
              className={css({ display: "inline-flex", p: "1.5", color: "fg", borderRadius: "md" })}
            >
              <Icon name={name} />
            </span>
          </Highlight>
        ) : (
          <Icon key={name} name={name} />
        ),
      )}
    </div>
  );
}

const highlightRing = css({
  animation: "[highlightPulse 1.6s ease-in-out infinite]",
  boxShadow: "[0 0 0 3px {colors.highlight}]",
  _motionReduce: { animation: "[none]" },
});

/**
 * 「ここを押す」を示す枠。押す対象の要素そのものに付け、形と大きさを合わせる（外側に箱を足さない）。
 * 角の丸みは対象の要素のものがそのまま使われる。`block` は行の中で幅いっぱいに広げる。
 */
export function Highlight({
  children,
  block = false,
}: {
  children: ReactElement<{ className?: string }>;
  block?: boolean;
}) {
  return cloneElement(children, {
    className: cx(children.props.className, highlightRing, block && css({ flex: "1" })),
  });
}

/** 手順の番号の丸。 */
export function Mark({ n }: { n: number }) {
  return (
    <span
      className={css({
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        w: "5",
        h: "5",
        borderRadius: "full",
        bg: "highlight",
        color: "highlight.fg",
        fontSize: "xs",
        fontWeight: "bold",
      })}
    >
      {n}
    </span>
  );
}

/** 図の中の小さな札（「例」など）。 */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      className={css({
        ml: "auto",
        px: "2",
        borderRadius: "full",
        bg: "bg.sunken",
        fontSize: "xs",
        fontWeight: "bold",
      })}
    >
      {children}
    </span>
  );
}

/** ブックマークレットのプログラムの書き出し（図の中で、URLの欄に入る文字として見せる）。 */
export function CodeSample() {
  return (
    <span className={css({ fontFamily: "mono", fontSize: "xs", color: "fg.muted" })}>
      javascript:(function(){"{"}…
    </span>
  );
}

/** 「(例：シリアルスナップ)」。名前の途中で折り返さないよう、まとめて次の行へ送る。 */
export function Example({ name }: { name: string }) {
  return <span className={css({ display: "inline-block" })}>(例：{name})</span>;
}

/** 案内の補足。 */
export function Note({
  icon = "info",
  tone = "info",
  children,
}: {
  icon?: IconName;
  tone?: "info" | "warn";
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        css({
          display: "flex",
          gap: "2.5",
          p: "3",
          borderRadius: "md",
          fontSize: "sm",
          "& > svg": { flex: "none" },
        }),
        tone === "info"
          ? css({ bg: "accent.subtle", "& > svg": { color: "accent.text" } })
          : css({
              bg: "warn.subtle",
              color: "warn",
              borderWidth: "1px",
              borderColor: "warn.border",
            }),
      )}
    >
      <Icon name={icon} />
      <div className={css({ display: "grid", gap: "0.5" })}>{children}</div>
    </div>
  );
}

/** 「ブックマークレットとは」の説明。案内で初めてこの言葉が出るところに置く。 */
export function BookmarkletAbout() {
  return (
    <Note icon="bookmark">
      <b>ブックマークレットとは</b>
      <span>
        応募サイトの入力欄にシリアルナンバーをまとめて入れるブックマークです。追加は最初に一度のみです。
      </span>
    </Note>
  );
}

/**
 * 「この表示が出れば完了です」の図。アプリの画面の上端に、ブックマークレットのパネルが重なったところ。
 * パネルの中身は src/bookmarklet の「追加完了」と同じにする。
 */
export function PanelPreview({ bare = false }: { bare?: boolean }) {
  return (
    <div
      className={
        // `bare` はほかの図（ブラウザの画面など）の中に置くとき。外枠を付けない
        bare
          ? css({ position: "relative" })
          : css({
              position: "relative",
              pt: "2",
              px: "2",
              pb: "3",
              borderRadius: "md",
              bg: "bg.canvas",
              borderWidth: "1px",
              borderColor: "border",
            })
      }
    >
      <div
        className={css({
          bg: "bg.surface",
          borderWidth: "2px",
          borderColor: "fg",
          borderRadius: "lg",
          boxShadow: "lg",
          overflow: "hidden",
          fontSize: "sm",
        })}
      >
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            minH: "10",
            pl: "3",
            pr: "2",
            borderBottomWidth: "1px",
            borderColor: "border",
            fontWeight: "bold",
            "& > svg:first-child": { color: "accent.text" },
          })}
        >
          <Icon name="clipboard" size={18} />
          <span className={css({ flex: "1" })}>シリアルスナップ</span>
          <span
            className={css({
              px: "2",
              borderWidth: "1px",
              borderColor: "border.strong",
              borderRadius: "full",
              color: "fg.muted",
              fontSize: "xs",
              fontWeight: "normal",
            })}
          >
            非公式
          </span>
          <Icon name="close" size={18} />
        </div>
        <div className={css({ display: "grid", gap: "2", p: "3" })}>
          <span
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "2",
              fontWeight: "bold",
              "& > svg": { color: "accent.text" },
            })}
          >
            <Icon name="check" size={20} />
            追加完了。応募サイトで使えます
          </span>
          <span
            className={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minH: "9",
              borderWidth: "1px",
              borderColor: "border.strong",
              borderRadius: "md",
              fontWeight: "bold",
            })}
          >
            閉じる
          </span>
        </div>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "1.5",
            px: "3",
            py: "1.5",
            bg: "bg.sunken",
            color: "fg.muted",
            fontSize: "xs",
          })}
        >
          <Icon name="lock" size={14} />
          シリアルナンバーはこのページの入力欄のみに入れ、外へ送りません
        </div>
      </div>
    </div>
  );
}

/** 図に出す架空のシリアルナンバー。 */
export const SAMPLE_SERIALS = ["AB12CD34EF56GHX", "Q7RT2LM9KX4VN6B", "KM7O2PQ9XR4TN8W"];

/** 図の中の、応募サイトの入力欄。 */
export const fakeInput = css({
  display: "flex",
  alignItems: "center",
  h: "8",
  px: "2",
  borderRadius: "sm",
  borderWidth: "1px",
  borderColor: "border.strong",
  fontFamily: "mono",
  fontSize: "sm",
});

/** 使い方の図で、ボタンを押す動き。 */
export const tapMotion = css({
  animation: "[howtoTap 3s ease-in-out infinite]",
  _motionReduce: { animation: "[none]" },
});

/** 使い方のコピーの図で、ボタンを押す動き。押したあとの表示の入れ替えと同じ周期（4秒）にする。 */
const copyTapMotion = css({
  animation: "[howtoCopyTap 4s ease-in-out infinite]",
  _motionReduce: { animation: "[none]" },
});

/**
 * スキャン結果の画面の下端の「1〜10件目をコピー」（押すところを示す）。
 * @param tap ボタンを押す動きを付ける（使い方のコピーの図）
 */
export function CopyBarMock({ tap = false }: { tap?: boolean }) {
  return (
    <Mock>
      <div className={css({ display: "flex", p: "3" })}>
        {/* 押す動き（大きさ）と「ここを押す」の枠（影）は、同じ要素に付けると animation がぶつかるため分ける */}
        <div className={cx(css({ flex: "1", display: "flex" }), tap && copyTapMotion)}>
          <Highlight block>
            <span
              className={css({
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "2",
                minH: "11",
                borderRadius: "md",
                bg: "accent",
                color: "accent.fg",
                fontWeight: "bold",
              })}
            >
              <Icon name="copy" size={18} />
              1〜10件目をコピー
            </span>
          </Highlight>
        </div>
      </div>
    </Mock>
  );
}

/** 入力欄の文字が順に入る動き。 */
const fillMotion = css({
  opacity: "0",
  animation: "[howtoFill 3.6s ease-out infinite]",
  _motionReduce: { animation: "[none]", opacity: "1" },
});
/** 確かめた印が順に付く動き。 */
const checkMotion = css({
  opacity: "0",
  color: "accent.text",
  animation: "[howtoCheck 3s ease-out infinite]",
  _motionReduce: { animation: "[none]", opacity: "1" },
});
/** パネルが上から出る動き。 */
const dropMotion = css({
  animation: "[howtoDrop 3.6s ease-out infinite]",
  _motionReduce: { animation: "[none]" },
});
/** 入力欄ごとの、動き出しの遅れ（秒）。上から順に入って見えるようにする。 */
const STAGGER_S = 0.15;

/**
 * ブックマークレットで入力したあとの応募サイト。パネルの「入力しました」と、入った入力欄と登録ボタン。
 * @param highlightSubmit 登録ボタンを「ここを押す」で示す
 * @param motion 使い方の図の動き。`fill` はパネルが出て入力欄に文字が入る、`check` は入力欄に確かめた印が付く
 */
export function FilledMock({
  highlightSubmit = true,
  motion,
}: {
  highlightSubmit?: boolean;
  motion?: "fill" | "check";
}) {
  const submit = (
    <span
      className={css({
        flex: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minH: "11",
        borderRadius: "sm",
        bg: "fg",
        color: "bg.surface",
        fontWeight: "bold",
      })}
    >
      シリアルナンバー登録
    </span>
  );
  const serials = motion ? SAMPLE_SERIALS : SAMPLE_SERIALS.slice(0, 2);
  return (
    // パネルが上から出る動きを、図の枠の外では見せない
    <div
      className={css({
        display: "grid",
        gap: "2.5",
        overflow: motion === "fill" ? "hidden" : "visible",
      })}
    >
      <div className={cx(motion === "fill" && dropMotion)}>
        <Mock>
          <div
            className={css({
              display: "flex",
              alignItems: "center",
              gap: "2",
              px: "3",
              py: "2.5",
              fontSize: "sm",
              fontWeight: "bold",
              "& > svg": { color: "accent.text" },
            })}
          >
            <Icon name="check" size={20} />
            1〜10件目を入力しました
          </div>
        </Mock>
      </div>
      <Mock>
        <div className={css({ display: "grid", gap: "1.5", p: "3" })}>
          {serials.map((s, i) => (
            <span key={s} className={cx(fakeInput, css({ justifyContent: "space-between" }))}>
              <span
                className={cx(motion === "fill" && fillMotion)}
                style={{ animationDelay: `${i * STAGGER_S}s` }}
              >
                {s}
              </span>
              {motion === "check" && (
                <span
                  className={cx(css({ display: "inline-flex" }), checkMotion)}
                  style={{ animationDelay: `${i * STAGGER_S * 2}s` }}
                >
                  <Icon name="check" size={16} />
                </span>
              )}
            </span>
          ))}
          <span className={css({ fontSize: "xs", color: "fg.muted", textAlign: "center" })}>…</span>
          <div className={css({ display: "flex" })}>
            {highlightSubmit ? <Highlight block>{submit}</Highlight> : submit}
          </div>
        </div>
      </Mock>
    </div>
  );
}
