# DeepSeek Harness Desktop

[日本語](README.ja.md) | [中文](README.zh.md)

An unofficial macOS Electron wrapper for DeepSeek Harness. Based on DeepSeek Harness, this project adds Japanese localization, macOS window integration, and bundled runtimes for distribution.

This project is not an official desktop application from DeepSeek AI. The upstream project is [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

## Features

- Electron application for macOS
- Japanese UI localization
- Node.js and the DeepSeek Harness runtime bundled with the application
- Builds for Apple Silicon (arm64)

DeepSeek Harness itself is a Developer Preview and may be affected by compatibility changes upstream.

## Development

```sh
npm install
npm run start
```

During development, the `dsh` command is resolved from `PATH`. Distribution builds embed DeepSeek Harness and the Node.js runtime into the application bundle at build time.

## Build

```sh
# Generate the application bundle
npm run build:dir

# Generate a DMG and application bundle
npm run build
```

`prepare-bundle` downloads `@deepseek-ai/dsh@0.1.0-rc.6` and the Node.js runtime, then applies Japanese localization and the third-party license list. A network connection is required to build the application.

## Upstream project

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [DeepSeek Harness README](https://github.com/deepseek-ai/deepseek-harness#readme)

## Community and support

- Submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [dsh-plugin](https://github.com/topics/dsh-plugin) topic to your plugin repository to make it easier to discover.
- To join the DeepSeek Harness WeCom group, scan the WeCom assistant QR code and complete the group survey. The assistant will invite you after you complete it.

<table>
  <thead>
    <tr>
      <th align="center">WeCom assistant</th>
      <th align="center">Group survey</th>
      <th align="center">WeChat Official Account</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="assets/community-wecom-assistant.png" alt="DeepSeek Harness WeCom assistant QR code" width="180" height="180"></td>
      <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="assets/community-wecom-survey.png" alt="DeepSeek Harness group survey QR code" width="180" height="180"></a></td>
      <td align="center"><img src="assets/community-wechat-official-account.png" alt="DeepSeek Harness team WeChat Official Account QR code" width="180" height="180"></td>
    </tr>
  </tbody>
</table>

## License

Code originating from upstream and code added in this fork are licensed under the MIT License. See [LICENSE](LICENSE) for details.

Licenses for bundled dependencies are listed in the generated [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
