# Clash Party / Mihomo：按 Loon 习惯定制的远程覆写

## 文件说明

- ClashParty-ProxyRules.js：**当前实际使用的远程覆写**，根据个人 Loon 的策略组和分流偏好改写。
- convert.js：原作者 powerfullz/override-rules 的可读版构建，仅作参考，**不是当前生效脚本**。
- LICENSE.upstream：原作者 MIT 许可证，保留其许可及来源。

上游参考项目：https://github.com/powerfullz/override-rules

## Clash Party 远程导入 URL

GitHub Raw：

https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/clash/overrides/ClashParty-ProxyRules.js

jsDelivr：

https://cdn.jsdelivr.net/gh/Annihilatexv/proxy-configs@main/clash/overrides/ClashParty-ProxyRules.js

在 Clash Party 的「覆写」中新建/导入 JavaScript 远程覆写，并给当前订阅选用。GitHub 更新后还应手动刷新远程覆写文件（不只是刷新节点订阅）。

## 与 Loon 对齐的分组

| 组 | 规则 / 默认顺序 |
| --- | --- |
| 节点选择 | 命悬一线 → 大碗 → US/HK/TW/JP/KR/SG → ALL_Filter → DIRECT |
| 命悬一线 | 非免费普通节点自动测速，600s |
| 大碗 | 优先 [free] 免费节点，失效时回退命悬一线 |
| JP/HK/TW/SG | 各地区自动测速 |
| KR | 手动选择韩国节点 |
| US | RackNerd 优先，其他美区节点故障转移 |
| 兜底后备策略 | HK → TW → JP → KR → SG → US → 命悬一线 |
| OpenAI | JP → 节点选择 → US → SG |
| Anthropic / Gemini / Grok | US → 节点选择 → SG → JP |
| Linux.do | 节点选择 → JP → US → SG → KR → HK → TW |
| YouTube | 大碗 → 节点选择 |
| Telegram | DIRECT → 大碗 → 节点选择 → US |

地区与免费节点从 Clash 当前订阅中识别。若使用 proxy-providers，则通过 use / filter 动态筛选。RackNerd 在 Loon 里属于订阅标签；在 Clash 节点名称中不一定存在，因此只能尽力通过节点名识别。

## 规则映射

- Grok / xAI、OpenAI、Anthropic、Gemini 按 Loon 分成独立服务组。
- YouTube、Telegram、Google、Twitter、PikPak 使用 Mihomo 域名 / GEOSITE 规则做相似分流。
- Bing、linuxdo.org、qq.com、speedtest.net 等按原 Loon 的习惯直连。
- jsDelivr、arXiv、OpenReview、Hugging Face、NeurIPS、V2EX 等按原 Loon 习惯走节点选择。
- GeoIP/GeoSite 国内直连；其他流量最后走兜底后备策略。
- 广告拦截采用公开的 AWAvenue Mihomo 规则集，GFW 则使用 Loyalsoldier 的公开规则集。**这两者不是 Loon 原远程规则的一对一复制。**
- IPv6 关闭；保留 Clash Party 已有 DNS、TUN 配置；启用基础 SNI 嗅探。

## 尚未迁移 / 注意事项

1. Loon 的 Remote Proxy 订阅地址、机场节点、MITM 证书与密码、私有域名、公网服务器 IP 均未复制到公开仓库。
2. Loon 已启用的 iOS 更新屏蔽、抖音修改 IP、插件和定时脚本尚未等效迁移；尤其 Rewrite/MITM/脚本不能直接作为 Clash JS 覆写使用。
3. Loon 的远程 OpenAI/Claude/YouTube/Bing 等 .list 规则暂用 Mihomo 内建规则近似替代，覆盖范围可能不同。
4. 如节点名称不包含地区标记、RackNerd 或 [free] 字样，自动分类需要进一步校准。没有某地区节点时，部分区域组可能会回退到通用节点。
5. 已使用模拟节点测试 JavaScript 执行、策略组引用及规则顺序，但未在真实 Clash Party / Mihomo 内核中完成导入运行测试。
6. 远程 URL 遇到 ERR_CERT_AUTHORITY_INVALID 时需要检查 HTTPS 证书链和代理网络；CDN 切换只是排查方式。

以后编辑 ClashParty-ProxyRules.js 即可更新自定义配置，convert.js 保持为上游参考版本。
