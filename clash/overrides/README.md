# Clash Party 日常覆写（对齐 Loon）

这份覆写按个人 Loon 配置重写，**只保留 Loon 已配置的策略与相应的路由方向**，不再继承原作者 `convert.js` 中的加密货币、静态资源、金融、流媒体细分等额外策略组。

## 远程 JavaScript 覆写

- GitHub Raw：https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/clash/overrides/ClashParty-ProxyRules.js
- jsDelivr：https://cdn.jsdelivr.net/gh/Annihilatexv/proxy-configs@main/clash/overrides/ClashParty-ProxyRules.js

在 Clash Party 的 JavaScript 覆写中通过 URL 导入，并在当前配置订阅中启用。修改后需要刷新**覆写文件**。

## 策略组（与 Loon 对齐）

| Loon 策略组 | Clash Party |
| --- | --- |
| 节点选择 | 命悬一线、大碗、US、HK、TW、JP、KR、SG、ALL_Filter、DIRECT |
| OpenAI | JP → 节点选择 → US → SG |
| Anthropic / Gemini / Grok | US → 节点选择 → SG → JP |
| Linux.do | 节点选择 → JP → US → SG → KR → HK → TW |
| YouTube | 大碗 → 节点选择 |
| Telegram | DIRECT → 大碗 → 节点选择 → US |
| RackNerd | 自动测速，优先匹配 RackNerd 提供者/节点名 |
| JP / HK / TW / SG | 各地区自动测速 |
| KR | 韩国节点手动选择 |
| US | RackNerd 优先，其余 US 节点故障转移 |
| 大碗 | [free] 节点优先，无可用节点时后备命悬一线 |
| 命悬一线 | ALL_Filter 的常规节点自动测速（不含 [free] / IPLC） |
| 兜底后备策略 | HK → TW → JP → KR → SG → US → 命悬一线 |

**实现细节：** Loon 的 `ALL_Filter` 在「节点选择」中被直接引用，因此为 Mihomo 保留为一个可选择的辅助组；`FREE_Filter` 直接交给「大碗」筛选，不再额外显示。移除了额外的自定义 `GLOBAL` 分组。自定义组总数：**19**（18 个 Loon 策略组 + 1 个 `ALL_Filter` 适配组）。

## 分流规则

以 Loon 的实际政策为准：OpenAI、Anthropic、Gemini、Grok、YouTube、Telegram 各自分流；PikPak / Twitter 等走「节点选择」；国内流量尽量直连；其余流量走「兜底后备策略」。保留 Loon 中已使用的少量网站直连/代理例外、DNS IPv6 关闭及基础 SNI 嗅探设置。

- 广告拦截使用 Mihomo 兼容的公开规则作为 Loon 去广告远程列表的替代，不是逐条复制。
- DNS / TUN 以 Clash Party 当前已有配置为基础，不导入 Loon 的敏感数据。
- Loon 的 MITM、插件、重写与脚本不能直接作为 Clash JS 覆写运行。iOS 更新屏蔽、抖音特殊规则等部分远程列表尚未完整迁移。
- 若 Clash 使用 `proxy-providers` 动态加载节点，地区及免费组依赖 provider 节点名过滤；某些地区没有节点时，不能保证与 Loon 故障转移行为完全相同，需在实际客户端验证。
- 已通过模拟节点与 proxy-providers 测试 JavaScript 执行和策略组引用，但尚未在你的 Clash Party 客户端完成实测。

## 公开仓库安全

不包含 Loon 原始 MITM 证书和密码、个人订阅地址、服务器凭据及私人域名/IP。请把个人规则放在私有的本地覆写中，不要上传至公开仓库。

## 来源

最初参考 [powerfullz/override-rules](https://github.com/powerfullz/override-rules) 的 MIT 开源项目，许可证保留为 `LICENSE.upstream`；当前使用的是独立整理的 Loon 风格覆写脚本，不再同时保留原 `convert.js` 构建文件。
