# Clash Party JavaScript 覆写

本目录保留了 [powerfullz/override-rules](https://github.com/powerfullz/override-rules) 的构建产物副本，作为以后自定义 Clash Party / Mihomo 覆写的起点。

## 文件
- `convert.min.js`：上游 `dist` 分支的压缩版本，适合在 Clash Party 中通过 URL 导入。
- `convert.js`：同一上游分支的未压缩构建版本，便于阅读和后续调整。
- `LICENSE.upstream`：原项目 MIT 许可证，保留原作者版权及授权条件。

原始参考链接：`https://cdn.jsdelivr.net/gh/powerfullz/override-rules/convert.min.js`

本次复制自原项目 `dist` 分支的已发布构建文件，没有改变 JavaScript 原有逻辑。以后如果修改 `convert.js`，请同时构建或更新 `convert.min.js`，以免远程订阅仍运行旧代码。

## Clash Party 远程覆写链接

```text
https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/clash/overrides/convert.min.js
```

在 Clash Party 的「覆写」中通过 URL 导入，然后为对应订阅选择该覆写脚本。开启/关闭应用内的 DNS 和域名嗅探接管需要根据实际配置决定。

## 来源与许可

Copyright (c) 2025 powerfullz。依据 MIT License 使用、修改和再分发。查看 `LICENSE.upstream`。

上游原项目：`https://github.com/powerfullz/override-rules`。
