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

## License

Code originating from upstream and code added in this fork are licensed under the MIT License. See [LICENSE](LICENSE) for details.

Licenses for bundled dependencies are listed in the generated [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
