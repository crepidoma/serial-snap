# 公開

`npm run build` で `dist/` に静的ファイルを出力し、そのまま置く。ヘッダーなしでも動くが、ページを分離するヘッダー（COOP/COEP）がある公開先では、文字認識が複数スレッドになり約2倍速くなる。ヘッダーを付けられない公開先（GitHub Pages など）では1スレッドで動く。

## Cloudflare Pages

1. Cloudflare Pages でGitHubのリポジトリをつなぐ。
2. ビルドの設定を次にする。
   - Build command: `npm run build`
   - Build output directory: `dist`
   - 環境変数 `NODE_VERSION`: `24`
3. 1ファイル25MBの上限があるが、最も大きいWASMでも約14MBで収まる。
4. `public/_headers`（ビルドで `dist/_headers` になる）により、COOP/COEP のヘッダーが付き、文字認識が複数スレッドになる。

## 公開後に確かめること

- iPhoneのSafariとAndroidのChromeで、初回の準備（約31MB）が終わり、写真を読み取れること。
- 機内モードで開き直しても読み取れること（Service Workerのキャッシュ）。
- ホーム画面に追加して開けること。
- ブックマークレットを追加し、応募サイトのシリアルナンバー登録の画面で「クリップボードから入力」を押すと入力欄へ入ること（登録ボタンは押さない）。

## 実機で確かめる

公開する前の変更をスマホで確かめるときは、開発サーバーを cloudflared の Quick Tunnel で一時的に外へ出す。

1. `npm run dev` で開発サーバーを起動する。
2. 別の端末で `npm run tunnel` を実行し、表示された `https://〜.trycloudflare.com` をスマホで開く。
3. 確かめ終わったら、両方を止める（URLを知っていれば誰でも開けるため）。

`npm run tunnel` は `scripts/cloudflared-quick.yml` を設定として読ませる。`~/.cloudflared/config.yml` に名前付きトンネルの振り分けがあると、Quick Tunnel のURLにも適用されて 404 になるため。開発サーバーは `vite.config.ts` で `.trycloudflare.com` からのアクセスを許可している。
