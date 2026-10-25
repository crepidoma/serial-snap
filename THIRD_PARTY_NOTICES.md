# 使っているモデル・ライブラリ

配布物（`dist/`）に含まれるもの。

| 名前 | 用途 | ライセンス |
| --- | --- | --- |
| [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) PP-OCRv4（`ch_PP-OCRv4_det_infer`・`ch_PP-OCRv4_rec_infer`）と文字の一覧 `ppocr_keys_v1.txt` | 文字の検出・認識（`src/assets/models`） | Apache License 2.0 |
| [@gutenye/ocr-models](https://github.com/gutenye/ocr) | 上のモデルのONNX形式への変換版の入手元 | MIT License |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) | ブラウザでモデルを動かす | MIT License |
| [zxing-wasm](https://github.com/Sec-ant/zxing-wasm)（[zxing-cpp](https://github.com/zxing-cpp/zxing-cpp) をWASMにしたもの） | QRコードの読み取り | MIT License（zxing-cpp は Apache License 2.0） |
| [React](https://github.com/facebook/react) | 画面 | MIT License |
| [IBM Plex Mono](https://github.com/IBM/plex)（[Fontsource](https://fontsource.org/fonts/ibm-plex-mono) の Latin の版） | シリアルナンバーの表示 | SIL Open Font License 1.1 |

PaddleOCR のモデルは変更せずに含めている。Apache License 2.0 の全文は https://www.apache.org/licenses/LICENSE-2.0 にある。

IBM Plex Mono は、Fontsource が配布している Latin の版を変更せずに含めている。SIL Open Font License 1.1 の全文は https://openfontlicense.org/ にある。
