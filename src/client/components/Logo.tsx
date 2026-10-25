/** アプリのロゴマーク（緑の角丸に読み取り枠とシリアルの枠）。ホーム画面に追加したときのアイコンも、この形で作る。 */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ flex: "none" }}>
      <rect width="32" height="32" rx="8" fill="#1D5C42" />
      <path
        d="M8 11V8h3M21 8h3v3M24 21v3h-3M11 24H8v-3"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="11" y="14" width="10" height="4" rx="1" fill="#FFFFFF" />
    </svg>
  );
}
