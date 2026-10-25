import { type ChangeEvent, type ReactNode, useRef, useState } from "react";
import { css } from "styled-system/css";
import { Button } from "../../components/Button.tsx";
import { Icon } from "../../components/Icon.tsx";
import { startScan } from "../../lib/scanJob.ts";
import { type Shot, ShotsScreen } from "./ShotsScreen.tsx";

/**
 * 撮影と写真の選択の、見えない入力欄と、それを開く関数。ボタンの形は画面ごとに決める。
 * `inputs` は画面のどこかに置く。
 * 「撮る」で始めたときは、撮るたびに撮影した写真の画面に足し、撮り終えてからまとめてスキャンする
 * （カメラは1回に1枚しか撮れないため）。「写真を選ぶ」は、選んだ写真をそのままスキャンする。
 */
export function usePhotoInputs(): {
  openCamera: () => void;
  openFiles: () => void;
  inputs: ReactNode;
} {
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const addShots = (files: File[]) =>
    setShots((prev) => [...prev, ...files.map((file) => ({ id: crypto.randomUUID(), file }))]);

  const takeFiles = (e: ChangeEvent<HTMLInputElement>): File[] => {
    const files = [...(e.target.files ?? [])];
    // 同じ写真をもう一度選んでも change が起きるよう、選択を消しておく
    e.target.value = "";
    return files;
  };

  return {
    openCamera: () => cameraRef.current?.click(),
    openFiles: () => filesRef.current?.click(),
    inputs: (
      <>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => addShots(takeFiles(e))}
        />
        <input
          ref={filesRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void startScan(takeFiles(e))}
        />
        <ShotsScreen
          shots={shots}
          onTake={addShots}
          onRemove={(i) => setShots((prev) => prev.filter((_, j) => j !== i))}
          onScan={() => {
            const files = shots.map((s) => s.file);
            setShots([]);
            void startScan(files);
          }}
          onDiscard={() => setShots([])}
        />
      </>
    ),
  };
}

/** 「撮る」「写真を選ぶ」の2つのボタン。左右に同じ大きさで並べる（トップ）。 */
export function PhotoPicker() {
  const { openCamera, openFiles, inputs } = usePhotoInputs();
  return (
    <div className={css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3" })}>
      <Button variant="primary" size="tile" onClick={openCamera}>
        <Icon name="camera" size={32} />
        撮る
      </Button>
      <Button size="tile" onClick={openFiles}>
        <Icon name="image" size={32} />
        写真を選ぶ
      </Button>
      {inputs}
    </div>
  );
}
