# DeepSeek Harness Desktop

[English](README.md) | [日本語](README.ja.md) | [简体中文](README.zh.md) | [繁體中文](README.zh-Hant.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [Deutsch](README.de.md)

Un wrapper Electron non officiel pour macOS de DeepSeek Harness. Basé sur DeepSeek Harness, ce projet ajoute la localisation multilingue, l’intégration des fenêtres macOS et des runtimes intégrés pour la distribution.

Ce projet n’est pas une application de bureau officielle de DeepSeek AI. Le projet upstream est [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

## Fonctionnalités

- Application Electron pour macOS
- Interface localisée en chinois simplifié, chinois traditionnel, anglais, japonais, coréen, espagnol, portugais brésilien, allemand et français
- Sélection automatique de la langue selon la langue préférée de macOS, avec des polices système macOS propres à chaque langue
- Node.js et le runtime de DeepSeek Harness intégrés à l’application
- Builds pour Apple Silicon (arm64)

DeepSeek Harness est lui-même en Developer Preview et peut être affecté par des changements de compatibilité en amont.

## Développement

```sh
npm install
npm run start
```

Pendant le développement, la commande `dsh` est résolue depuis le `PATH`. Les builds de distribution intègrent DeepSeek Harness et le runtime Node.js dans le bundle de l’application au moment du build.

## Build

```sh
# Générer le bundle de l’application
npm run build:dir

# Générer un DMG et le bundle de l’application
npm run build
```

`prepare-bundle` vérifie les dictionnaires de localisation, télécharge `@deepseek-ai/dsh@0.1.0-rc.6` et le runtime Node.js, puis applique les localisations et la liste des licences tierces. Une connexion réseau est nécessaire pour compiler l’application.

## Projet upstream

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [README de DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness#readme)

## Communauté et assistance

- Envoyez vos retours ou vos rapports de bugs via [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Ajoutez le sujet [dsh-plugin](https://github.com/topics/dsh-plugin) à votre dépôt de plugins pour faciliter sa découverte.
- Pour rejoindre le groupe WeCom de DeepSeek Harness, scannez le code QR de l’assistant WeCom et répondez à l’enquête du groupe. L’assistant vous invitera après l’envoi de l’enquête.

<table>
  <thead>
    <tr>
      <th align="center">Assistant WeCom</th>
      <th align="center">Enquête du groupe</th>
      <th align="center">Compte officiel WeChat</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="assets/community-wecom-assistant.png" alt="Code QR de l’assistant WeCom de DeepSeek Harness" width="180" height="180"></td>
      <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="assets/community-wecom-survey.png" alt="Code QR de l’enquête du groupe DeepSeek Harness" width="180" height="180"></a></td>
      <td align="center"><img src="assets/community-wechat-official-account.png" alt="Code QR du compte officiel WeChat de l’équipe DeepSeek Harness" width="180" height="180"></td>
    </tr>
  </tbody>
</table>

## Licence

Le code provenant de l’upstream et le code ajouté dans ce fork sont distribués sous la MIT License. Consultez [LICENSE](LICENSE) pour plus d’informations.

Les licences des dépendances incluses sont répertoriées dans le [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) généré.
