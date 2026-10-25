import { useEffect, useRef, useState } from "react";
import { css } from "styled-system/css";
import { AppShell } from "../../components/AppShell.tsx";
import { Button } from "../../components/Button.tsx";
import { DeleteDialog } from "../../components/DeleteDialog.tsx";
import { Icon } from "../../components/Icon.tsx";
import { TopBar } from "../../components/TopBar.tsx";
import { PhotoViewer } from "./PhotoViewer.tsx";
import { Body, card, muted, PhotoPreview } from "./Summary.tsx";

/** 撮影した写真1枚。`id` は一覧から削除したときに見本を取り違えないための目印。 */
export interface Shot {
  id: string;
  file: File;
}

/**
 * 「撮る」で始めたときの、撮影した写真の画面。続けて撮り、撮り終えたらまとめてスキャンする。
 * 写真は端末に保存せず、スキャンを始めるかやめるまでメモリにだけ置く。
 * 写真の一覧は、見つからなかった写真のまとめと同じ形にする。
 * 開いている画面の上に重ねる（撮影した写真を持つ画面を離れないため）。
 */
export function ShotsScreen({
  shots,
  onTake,
  onRemove,
  onScan,
  onDiscard,
}: {
  shots: Shot[];
  /** 「もう1枚撮る」で撮った写真 */
  onTake: (files: File[]) => void;
  onRemove: (index: number) => void;
  onScan: () => void;
  onDiscard: () => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [viewing, setViewing] = useState<number>();
  const open = shots.length > 0;

  // 重ねた画面を開いたら、読み上げとキーボードの位置をこの画面へ移す
  useEffect(() => {
    if (open) rootRef.current?.focus({ preventScroll: true });
  }, [open]);

  if (!open) return null;
  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="撮影した写真"
      tabIndex={-1}
      className={css({ position: "fixed", inset: "0", zIndex: "5", outline: "none" })}
    >
      <AppShell
        // 撮影した写真を失わないよう、ほかの画面へ移る「？」やメニューは置かない
        header={<TopBar title="撮影した写真" sub={`${shots.length}枚`} />}
        fill
      >
        <Body
          bottom={
            <>
              <Button variant="primary" size="lg" onClick={onScan}>
                {shots.length}枚をスキャン
              </Button>
              <Button onClick={() => cameraRef.current?.click()}>
                <Icon name="camera" />
                もう1枚撮る
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(true)}>
                やめる
              </Button>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])];
                  // 同じ写真をもう一度選んでも change が起きるよう、選択を消しておく
                  e.target.value = "";
                  onTake(files);
                }}
              />
            </>
          }
        >
          <p className={muted}>
            続けて撮れます。撮り終えたら「{shots.length}
            枚をスキャン」を押します。写真を押すと大きく見られます。
          </p>
          <section aria-label="撮影した写真" className={card}>
            <ul className={css({ display: "grid", gap: "3" })}>
              {shots.map((shot, i) => (
                <li
                  key={shot.id}
                  className={css({ display: "flex", alignItems: "center", gap: "3" })}
                >
                  <PhotoPreview
                    blob={shot.file}
                    label={`${i + 1}枚目の写真`}
                    onOpen={() => setViewing(i)}
                  />
                  <b className={css({ flex: "1", minW: "0" })}>{i + 1}枚目の写真</b>
                  <Button
                    variant="ghostDanger"
                    size="sm"
                    aria-label={`${i + 1}枚目の写真を削除`}
                    onClick={() => onRemove(i)}
                  >
                    削除
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </Body>
      </AppShell>
      <PhotoViewer
        file={viewing === undefined ? undefined : shots[viewing]?.file}
        label={`${(viewing ?? 0) + 1}枚目の写真`}
        onClose={() => setViewing(undefined)}
      />
      <DeleteDialog
        open={confirming}
        title="撮影した写真を削除しますか？"
        what={`撮影した${shots.length}枚を削除します。`}
        keep="スキャンは始まりません。これまでのスキャンは消えません。"
        action="削除"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onDiscard();
        }}
      />
    </div>
  );
}
