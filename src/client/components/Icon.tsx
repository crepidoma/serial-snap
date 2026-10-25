const paths = {
  camera: ["M4 8h3l1.5-2h7L17 8h3v11H4z", "M12 9.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z"],
  image: [
    "M5 7h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z",
    "M7 4h12a2 2 0 0 1 2 2v10",
    "m3 16 4-4 4 4 2-2 4 4",
  ],
  help: [
    "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z",
    "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.5",
    "M12 17v.5",
  ],
  menu: ["M4 7h16M4 12h16M4 17h16"],
  more: ["M5 12h.01M12 12h.01M19 12h.01"],
  chevronLeft: ["m14 6-6 6 6 6"],
  chevronRight: ["m10 6 6 6-6 6"],
  close: ["M6 6l12 12M18 6 6 18"],
  copy: [
    "M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z",
    "M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2",
  ],
  check: ["m5 12 5 5 9-10"],
  edit: ["m5 19 1-4L16 5l3 3L9 18z"],
  trash: ["M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"],
  external: ["M14 5h5v5M19 5l-8 8", "M11 7H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5"],
  lock: [
    "M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z",
    "M8 11V8a4 4 0 0 1 8 0v3",
  ],
  bookmark: ["M7 4h10v17l-5-4-5 4z"],
  /** iPhoneのSafariのブックマーク（本のマーク） */
  book: ["M12 7c-2-1.5-5-2-8-2v13c3 0 6 .5 8 2 2-1.5 5-2 8-2V5c-3 0-6 .5-8 2zM12 7v13"],
  /** Androidのブックマーク（☆） */
  star: ["m12 4 2.5 5.2 5.5.8-4 4 1 5.6-5-2.7-5 2.7 1-5.6-4-4 5.5-.8z"],
  moreVertical: ["M12 5h.01M12 12h.01M12 19h.01"],
  /** 案内の図の、マウスのポインター */
  cursor: ["M6 3l13 8-6 1.5-2.5 6z"],
  folder: ["M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"],
  arrowLeft: ["M19 12H5M11 6l-6 6 6 6"],
  arrowRight: ["M5 12h14M13 6l6 6-6 6"],
  arrowDown: ["M12 5v14M6 13l6 6 6-6"],
  download: ["M12 4v11M7 11l5 5 5-5M5 20h14"],
  grip: ["M9 6v.01M15 6v.01M9 12v.01M15 12v.01M9 18v.01M15 18v.01"],
  /** ブックマークレットのパネルの印 */
  clipboard: [
    "M8 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1",
    "M9 3h6v4H9zM9 12h6M9 16h6",
  ],
  warn: ["M12 4 3 20h18z", "M12 10v5M12 17.5v.5"],
  offline: ["M3 9a14 14 0 0 1 18 0M6 12.5a9 9 0 0 1 12 0M9 16a4.5 4.5 0 0 1 6 0", "M4 4l16 16"],
  reload: ["M20 12a8 8 0 1 1-2.5-5.8M20 4v4h-4"],
  zoom: ["M11 4.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z", "m16 16 4.5 4.5", "M8.5 11h5M11 8.5v5"],
  search: ["M11 4.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z", "m16 16 4.5 4.5", "M8.5 11h5"],
  history: ["M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17z", "M12 7.5V12l3 2"],
  theme: ["M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17z", "M12 3.5v17"],
  info: ["M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17z", "M12 11v5M12 7.5v.5"],
  play: ["M8 5v14l11-7z"],
} as const;

/** 画面で使うアイコンの名前。 */
export type IconName = keyof typeof paths;

/** 線で描いたアイコン。意味は隣の文字か `aria-label` で伝えるため、読み上げからは隠す。 */
export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
