/** アプリのロゴマーク（緑の角丸に読み取り枠と3文字）。ホーム画面に追加したときのアイコンも、この形で作る。 */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ flex: "none" }}>
      <rect width="32" height="32" rx="8" fill="#1D5C42" />
      <path
        d="M7.5 11V7.5H11M21 7.5h3.5V11M24.5 21v3.5H21M11 24.5H7.5V21"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="10.5" y="13" width="3" height="6" rx="1" fill="#FFFFFF" />
      <rect x="14.5" y="13" width="3" height="6" rx="1" fill="#FFFFFF" />
      <rect x="18.5" y="13" width="3" height="6" rx="1" fill="#FFFFFF" />
    </svg>
  );
}
