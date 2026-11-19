# Clash Party：Loon 风格远程覆写

当前脚本：**ClashParty-ProxyRules.js**。本仓库仅维护这份精简的 Loon 风格分流，不保留原作者的加密货币、静态资源、金融、其他流媒体等附加策略组。

## 远程导入

GitHub Raw（推荐）：

https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/clash/overrides/ClashParty-ProxyRules.js

在 Clash Party 的「覆写」中以 JavaScript 类型添加 URL，并在订阅配置上启用该覆写。更新 GitHub 后，需要刷新**远程覆写文件**、刷新订阅，并重新应用配置。

## 当前实现方式（2026-11-19 更新）

之前的实现曾经覆盖所有原订阅代理组，只依靠 Mihomo 的 include-all 和内核筛选找节点。用户实测开启覆写后地区组缺失大部分节点，TW/KR/SG 等显示 COMPATIBLE。COMPATIBLE 是空组的占位回退，不是实际节点。

**现改为双路径：**

1. **顶层 proxies 中的真实节点**：JavaScript 用各地区正则直接筛选，明确写进地区组的 proxies 列表。这是最容易确定和检查的方式；不依赖内核后续二次自动填充。
2. **proxy-providers 中的动态节点**：策略组显式设置 use（引用当前配置中存在的 provider 名称），再设置 filter、exclude-filter；这属于 Mihomo 正式支持的配置格式。
3. 对 JP/HK/TW/KR/SG/US，排除表达式为 IPLC 或 [free]，与 Loon 地区过滤习惯一致；ALL_Filter 和命悬一线仍然排除常见订阅信息或免费节点。
4. 对于在 JS 阶段看不到任何 proxies 且没有 proxy-providers 的配置，**保留原始配置**，避免强行生成空代理组。
5. 使用现有 Clash 订阅的节点和 Provider，不导入原始 Loon 机场 URL 或密钥。

**注意**：JS 的模拟运行已覆盖显式节点、只有 Provider、混合配置、空输入四种结构；用户客户端中的最终表现还需要刷新覆写后确认。若依旧漏匹配，需要针对实际输入结构诊断。

## 组与优先级

| 策略 | 分组或默认选项 |
| --- | --- |
| 节点选择 | 命悬一线、大碗、US、HK、TW、JP、KR、SG、ALL_Filter、DIRECT |
| OpenAI | JP、节点选择、US、SG |
| Anthropic / Gemini / Grok | US、节点选择、SG、JP |
| Linux.do | 节点选择、JP、US、SG、KR、HK、TW |
| YouTube | 大碗、节点选择 |
| Telegram | DIRECT、大碗、节点选择、US |
| JP、HK、TW、SG | 地区节点自动测速 |
| KR | 地区节点手动选择 |
| US | 有 RackNerd 来源时优先 RackNerd，其后为 US 地区节点 |
| RackNerd | 若提供者名或节点名可识别，则使用该来源 |
| 命悬一线 | 合格普通节点自动测速（不含 [free] 和 IPLC） |
| 大碗 | 免费节点组失败后转用命悬一线 |
| 兜底后备策略 | HK、TW、JP、KR、SG、US、命悬一线 |

保留 Loon 的 18 个策略组以及一个 ALL_Filter 辅助组；**只有检测到 [free] 节点或存在 proxy-providers 时才创建隐藏的 FREE_Filter**。因此总数为 19 或 20 组（视订阅而定）。所有生成的组均有图标和有效节点/Provider 来源。

## 2026-11-19 修复：FREE_Filter 缺少 proxies/use

**错误：** `proxy group[1]: FREE_Filter: use or proxies missing`。

**原因：** 订阅没有匹配到 `[free]` 普通节点、又没有可引用的 Provider 时，旧逻辑仍创建 `FREE_Filter`，只写 `proxies: []`。Mihomo 要求每个策略组具有至少一个非空的 `proxies` 或 `use` 来源。`empty-fallback` 只规定运行时空组的回退节点，不能替代 `proxies/use` 来通过配置解析。

**处理：**
- 如果没有 `[free]` 节点且不存在 Provider，则不创建 `FREE_Filter`，`大碗` 直接使用 `命悬一线`。
- 如果有 `[free]` 节点或 Provider，则保留 `FREE_Filter`，并使用明确的节点列表或 `use`。
- 对其他缺少来源的地区组添加 `命悬一线` 回退引用；`ALL_Filter` 和 `命悬一线` 在完全无合格代理时回退 `DIRECT`，保证 Mihomo 配置至少可解析。
- 新增严格的回归断言：**每个生成的 proxy-group 都必须满足 `proxies.length > 0 || use.length > 0`**。测试了普通节点（有/无免费）、只有免费节点、纯 Provider、混合、空配置共六种情形。

仍需在真实 Clash Party 客户端重新载入测试；单元测试通过并不等于内核配置解析通过。

## 地区中文关键词增强（2026-11-19）

地区筛选已补充 **简体与繁体中文**，可以识别带任意协议和线路前后缀的名称，例如 `VLESS-台湾家宽`、`VLESS-臺灣家寬`、`Trojan-香港家宽`、`VLESS-日本家宽`、`VLESS-美国家宽` 等。

同时保留 Loon 的基本中文词，补充首尔/首爾、东京/東京、台北/臺北、九龍/九龙、舊金山/旧金山等地区别名，以及常用英文城市、机场代码、国旗。

英文地区和机场缩写设置非字母边界，减少 `SIN` 误命中 `Single`、`US` 误命中 `AUS`。JP/HK/TW/KR/SG/US 仍只排除 `IPLC` 与 `[free]`；通用 ALL_Filter 和命悬一线继续使用更严格的排除规则。

回归测试增加中文简繁体、协议前缀、Provider 正则和误判测试，均以合成名称运行，不涉及私人机场数据。

**重要：** 如果 `VLESS-台湾家宽` 仍然不出现在 TW，说明需要进一步检查覆写日志中该组的 `explicit` 和 `providerRefs`，而非继续盲目添加关键词。模拟测试无法保证 Clash Party 中的实际节点来源已经完整载入。

## 安全诊断日志（仅计数）

脚本会在 Clash Party 的 **JavaScript 覆写执行日志** 中输出两条以 Loon-override 开头的信息，例如：

- 输入：inlineCount（传入 proxies 项数）、providerCount（传入 provider 数）、originalGroupCount（原代理组数）。
- 各地区：explicit（JavaScript 明确写入的候选数量）、providerRefs（引用了多少 Provider）。

这些日志**不包含实际节点名称、订阅 URL、密码、服务器信息**。若客户端仍然出现 COMPATIBLE，请先提供这两行计数记录，而不是私人订阅。

## 测试、限制与安全

- 回归脚本：tests/region-matching.test.cjs，命令为 node clash/overrides/tests/region-matching.test.cjs。
- JavaScript 的显式节点筛选和 Provider 引用已进行模拟测试；并未在用户的真实 Clash Party / Mihomo 内核上验收通过。
- 如果 Provider 的节点名称没有地区关键词，或者被 Provider 自身先行过滤，组规则也无法自动猜测其地区，需要单独修正命名或 Provider 规则。
- Loon 的插件、MITM、重写、定时脚本不能直接作为 Mihomo JavaScript 覆写使用。iOS 更新屏蔽、抖音特殊规则尚未完成等效迁移。
- 仓库公开：不保存私人机场订阅、代理凭据、MITM 证书/密码、个人公网 IP 等敏感信息。

本项目最初参考 MIT 开源的 [powerfullz/override-rules](https://github.com/powerfullz/override-rules)；原许可保留在 LICENSE.upstream。
