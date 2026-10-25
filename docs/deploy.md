# 公開

`npm run build` で `dist/` に静的ファイルを出力し、そのまま置く静的サイトとする。ヘッダーなしでも動くが、ページを分離するヘッダー（COOP/COEP）がある公開先では、文字認識が複数スレッドになり約2倍速くなる。ヘッダーを付けられない公開先（GitHub Pages など）では1スレッドで動く。

`https://serial-snap.yabworks.com/` に、Cloudflare の Workers の静的アセットとして公開する（Worker のコードは持たない。設定は `wrangler.jsonc`）。配布の経路は `.github/workflows/deploy.yml` だけで、`main` に入ると CI で検査した後（`main` へのPRのマージで、そのPRのCIが成功していれば省く）に `wrangler deploy` する。PR を経ずに `main` へ push されたコミットは配布せず、ワークフローを失敗にする。手で配布するときは Actions → Deploy → Run workflow で動かす。

## 配信の設定

- `public/_headers`（ビルドで `dist/_headers` になる）で、次のヘッダーを付ける。
  - COOP/COEP（文字認識を複数スレッドにする）、`X-Content-Type-Options`・`Referrer-Policy`・`frame-ancestors`。
  - 画面と `sw.js` は `max-age=0` で毎回確かめ、`no-transform` で Cloudflare に HTML を書き換えさせない（ゾーンの Web Analytics の自動挿入や Email Obfuscation が入らないように）。
  - `assets/` の下は名前にハッシュが入るため、1年キャッシュする。
- 検索エンジンとSNS向けに、`index.html` に説明・canonical・OGP・構造化データ（JSON-LD）を書き、`robots.txt`・`sitemap.xml`・`og-image.png` を置く。画面はハッシュで切り替えるため、載せるURLは `/` だけ。この3ファイルは画面が使わないため、Service Workerは保存しない。`og-image.png` はデザインキャンバスの「共有画像」の画板を書き出したもので、文言やロゴを変えたら作り直す。公開先のURLを変えたら、これらの絶対URLも直す。
- 1ファイル25MiBの上限があるが、最も大きいWASMでも約14MBで収まる。
- 静的アセットへのリクエストは無料で、Worker の呼び出しに数えない。

## 準備

1. ゾーン（yabworks.com）の設定を確かめる。このホストのための個別の設定は要らない。
   - Web Analytics の自動挿入は、ゾーン全体で無効にしている（入っても `no-transform` で HTML は書き換えられない）。
   - レート制限のルールは、Worker が動くパス（`/api/`・`/mcp`・`/oauth/`）だけを数える。このサイトは静的アセットだけで、そのパスを持たない。
2. API トークンを作る。My Profile → API Tokens で「Edit Cloudflare Workers」のテンプレートから作り、Account Resources をこのアカウント、Zone Resources を yabworks.com に絞る。
3. GitHub の設定。
   - Settings → Environments で `production` を作り、Secrets に `CLOUDFLARE_API_TOKEN`（2 のトークン）を置く。必要なら承認者を付ける。
   - Settings → Secrets and variables → Actions → Variables に `CLOUDFLARE_ACCOUNT_ID`（アカウントID）を置く。これがなければ、`main` に入っても配布しない。
   - `main` を保護し、PR と CI の成功を必須にする（Settings → Rules）。
4. PR をマージするか、Actions → Deploy → Run workflow で配布する。Custom Domain は最初の配布で作られる。

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
