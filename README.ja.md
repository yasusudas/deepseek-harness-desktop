# DeepSeek Harness Desktop

[English](README.md) | [中文](README.zh.md)

非公式のmacOS Electronラッパー版DeepSeek Harnessです。DeepSeek Harness本体を基に、日本語ローカライズ、macOSのウィンドウ統合、配布用のランタイム同梱を追加しています。

本プロジェクトはDeepSeek AIの公式デスクトップアプリではありません。上流プロジェクトは[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)です。

## 特徴

- macOS向けElectronアプリ
- 日本語UIローカライズ
- Node.jsとDeepSeek Harnessランタイムをアプリに同梱
- Apple Silicon（arm64）向けビルド

DeepSeek Harness本体はDeveloper Previewです。上流の互換性変更の影響を受ける可能性があります。

## 開発

```sh
npm install
npm run start
```

開発起動では、`dsh`コマンドをPATH上から解決します。配布用ビルドでは、ビルド時にDeepSeek HarnessとNode.jsランタイムをアプリバンドルへ組み込みます。

## ビルド

```sh
# アプリバンドルを生成
npm run build:dir

# DMGとアプリバンドルを生成
npm run build
```

`prepare-bundle`は`@deepseek-ai/dsh@0.1.0-rc.6`とNode.jsランタイムをダウンロードし、日本語ローカライズと第三者ライセンス一覧を適用します。ビルドにはネットワーク接続が必要です。

## 上流プロジェクト

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [DeepSeek Harness README](https://github.com/deepseek-ai/deepseek-harness#readme)

## コミュニティとサポート

- フィードバックやバグ報告は[GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions)から送信できます。
- プラグインリポジトリに[dsh-plugin](https://github.com/topics/dsh-plugin)トピックを追加すると、見つけてもらいやすくなります。
- DeepSeek Harnessの企業微信（WeCom）グループへの参加を希望する場合は、企業微信アシスタントのQRコードを読み取り、入群アンケートに回答してください。回答後、アシスタントから招待されます。

<table>
  <thead>
    <tr>
      <th align="center">企業微信アシスタント</th>
      <th align="center">入群アンケート</th>
      <th align="center">微信公众号</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="assets/community-wecom-assistant.png" alt="DeepSeek Harness 企業微信アシスタントのQRコード" width="180" height="180"></td>
      <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="assets/community-wecom-survey.png" alt="DeepSeek Harness 入群アンケートのQRコード" width="180" height="180"></a></td>
      <td align="center"><img src="assets/community-wechat-official-account.png" alt="DeepSeek Harnessチームの微信公众号QRコード" width="180" height="180"></td>
    </tr>
  </tbody>
</table>

## ライセンス

上流由来コードとこのforkで追加したコードはMIT Licenseです。詳細は[LICENSE](LICENSE)を参照してください。

同梱依存パッケージのライセンスは、生成された[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)に記載しています。
