/**
 * Clash Party / Mihomo - 日常分流覆写（参考个人 Loon 配置）
 * 适配方向：Loon 的节点策略组、AI 服务分流、手工直连、国内直连、广告屏蔽。
 * 原版参考：https://github.com/powerfullz/override-rules （MIT，LICENSE.upstream）
 *
 * 安全：
 * - 不包含私人机场订阅 URL、代理凭据、MITM 证书、私人域名和服务器 IP。
 * - Loon 的插件、MitM 和定时脚本不属于 Mihomo 分流规则，无法直接复制。
 *
 * 使用：Clash Party 的「JavaScript 覆写」中通过 URL 导入本文件。
 * 入口：main(config)；config 是当前已经解析好的 Clash/Mihomo 配置对象。
 */

"use strict";

const LOON = {
  testUrl: "https://cp.cloudflare.com/generate_204",
  regionPattern: {
    JP: "日本|川日|东京|大阪|泉日|埼玉|沪日|深日|Japan|\\bJP\\b|🇯🇵",
    US: "美国|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|United States|America|\\bUS\\b|\\bUSA\\b|🇺🇸",
    HK: "香港|港|Hong|\\bHK\\b|🇭🇰",
    TW: "台湾|台|Taiwan|\\bTW\\b|🇹🇼",
    KR: "韩国|首尔|韩|韓|Korea|\\bKR\\b|\\bKOR\\b|🇰🇷",
    SG: "新加坡|坡|狮城|Singapore|\\bSG\\b|🇸🇬"
  },
  // 与 Loon 中的免费/IPLC/订阅信息过滤方式相近；不使用 Go RE2 不支持的环视语法。
  freePattern: "\\[free\\]",
  excludePattern: "\\[free\\]|IPLC|官网|客服|网站|网址|订阅|流量|到期|过期|已用|邀请|返利|邮箱|工单|通知|频道|交流群|教程|联系|剩余|提示|套餐|((USE|USED|TOTAL|EXPIRE|EMAIL|Traffic)[0-9]*)",
  localDirect: [
    "DOMAIN-SUFFIX,linuxdo.org,DIRECT",
    "DOMAIN-SUFFIX,speedtest.net,DIRECT",
    "DOMAIN-SUFFIX,qq.com,DIRECT"
  ],
  localProxy: [
    "DOMAIN,cdn.jsdelivr.net,节点选择",
    "DOMAIN,greasyfork.org,节点选择",
    "DOMAIN,routinehub.co,节点选择",
    "DOMAIN-SUFFIX,dashboardicons.com,节点选择",
    "DOMAIN-SUFFIX,linux.do,Linux.do",
    "DOMAIN-SUFFIX,openreview.net,节点选择",
    "DOMAIN-SUFFIX,arxiv.org,节点选择",
    "DOMAIN-SUFFIX,neurips.cc,节点选择",
    "DOMAIN-SUFFIX,v2ex.com,节点选择",
    "DOMAIN-SUFFIX,huggingface.co,节点选择"
  ]
};

const ICON_ROOT = "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/";
const ICONS = {
  "节点选择": "Proxy.png", "命悬一线": "Auto.png", "大碗": "Available_1.png",
  "兜底后备策略": "Final.png", "OpenAI": "ChatGPT.png",
  "YouTube": "YouTube.png", "HK": "Hong_Kong.png",
  "TW": "Taiwan.png", "JP": "Japan.png", "KR": "Korea.png",
  "SG": "Singapore.png", "US": "United_States.png"
};

function distinct(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function matches(name, pattern) {
  return new RegExp(pattern, "i").test(name);
}

function addGroup(groups, name, type, entries, options = {}, providerNames = [], providerFilter = null, providerExclude = null) {
  const directEntries = distinct(entries);
  const group = { name, type, proxies: directEntries };
  if (providerNames.length > 0 && providerFilter) {
    group.use = providerNames.slice();
    group.filter = providerFilter;
    if (providerExclude) group["exclude-filter"] = providerExclude;
  }
  if (["fallback", "url-test", "load-balance"].includes(type)) {
    group.url = LOON.testUrl;
    group.interval = 600;
    group.lazy = true;
  }
  Object.assign(group, options || {});
  if (ICONS[name]) group.icon = ICON_ROOT + ICONS[name];
  // 未配置任何真实节点时避免建立空策略组；提供者组则交由内核动态注入。
  if (!group.proxies.length && !group.use) group.proxies = ["DIRECT"];
  groups.push(group);
}

function makeGroups(source) {
  const all = Array.isArray(source.proxies)
    ? source.proxies.filter(n => isObject(n) && typeof n.name === "string" && n.name).map(n => n.name)
    : [];
  const providerNames = isObject(source["proxy-providers"])
    ? Object.keys(source["proxy-providers"])
    : [];
  const allValid = distinct(all).filter(n => !matches(n, LOON.excludePattern));
  const freeNodes = distinct(all).filter(n => matches(n, LOON.freePattern));
  const normalNodes = allValid.length ? allValid : distinct(all);
  const regions = {};
  for (const key of Object.keys(LOON.regionPattern)) {
    regions[key] = normalNodes.filter(n => matches(n, LOON.regionPattern[key]));
  }
  const rackNerd = normalNodes.filter(n => /rack[\s_-]?nerd/i.test(n));
  const groups = [];
  // 顶层选项顺序沿用 Loon（具体节点名单来自当前 Clash 订阅，不导入 Loon 的凭据）。
  addGroup(groups, "节点选择", "select",
    ["命悬一线", "大碗", "US", "HK", "TW", "JP", "KR", "SG", "ALL_Filter", "DIRECT"],
    {}, [], null);
  addGroup(groups, "OpenAI", "select", ["JP", "节点选择", "US", "SG"]);
  addGroup(groups, "Anthropic", "select", ["US", "节点选择", "SG", "JP"]);
  addGroup(groups, "Gemini", "select", ["US", "节点选择", "SG", "JP"]);
  addGroup(groups, "Grok", "select", ["US", "节点选择", "SG", "JP"]);
  addGroup(groups, "Linux.do", "select", ["节点选择", "JP", "US", "SG", "KR", "HK", "TW"]);
  addGroup(groups, "YouTube", "select", ["大碗", "节点选择"]);
  addGroup(groups, "Telegram", "select", ["DIRECT", "大碗", "节点选择", "US"]);
  // 所有/免费节点合集用显式节点名；如果订阅采用 proxy-providers，则使用 Mihomo 原生 use + filter。
  addGroup(groups, "ALL_Filter", "select", normalNodes.length ? normalNodes : ["DIRECT"],
    {}, providerNames, ".*", LOON.excludePattern);
  addGroup(groups, "FREE_Filter", "select", freeNodes.length ? freeNodes : ["命悬一线"],
    {}, providerNames, LOON.freePattern);
  addGroup(groups, "命悬一线", "url-test", normalNodes.length ? normalNodes : (providerNames.length ? [] : ["DIRECT"]),
    { interval: 600, tolerance: 50 }, providerNames, ".*", LOON.excludePattern);
  addGroup(groups, "大碗", "fallback", [...freeNodes, "命悬一线"],
    { interval: 300 }, providerNames, LOON.freePattern);
  addGroup(groups, "RackNerd", "url-test", rackNerd.length ? rackNerd : ["命悬一线"],
    { interval: 300, tolerance: 50 }, providerNames, "Rack[Nn]erd");
  for (const key of ["JP", "HK", "TW", "KR", "SG"]) {
    const type = key === "KR" ? "select" : "url-test";
    const fallback = providerNames.length ? [] : ["命悬一线"];
    const base = regions[key].length ? regions[key] : fallback;
    addGroup(groups, key, type, base,
      type === "url-test" ? { interval: 600, tolerance: key === "TW" ? 30 : 50 } : {},
      providerNames, LOON.regionPattern[key], LOON.excludePattern);
  }
  // Loon US = fallback(RackNerd, US_Filter)。
  const hasRack = rackNerd.length > 0 || providerNames.length > 0;
  addGroup(groups, "US", "fallback",
    distinct([...(hasRack ? ["RackNerd"] : []), ...regions.US, ...(regions.US.length ? [] : ["命悬一线"])]),
    { interval: 600 }, providerNames, LOON.regionPattern.US, LOON.excludePattern);
  addGroup(groups, "兜底后备策略", "fallback",
    ["HK", "TW", "JP", "KR", "SG", "US", "命悬一线"],
    { interval: 60 });
  // GLOBAL 在全局模式下也能直接选择这些服务组。
  addGroup(groups, "GLOBAL", "select",
    ["节点选择", "兜底后备策略", "OpenAI", "YouTube", ...normalNodes, "DIRECT"],
    {}, providerNames, ".*", LOON.excludePattern);
  return groups;
}

function makeRules(hasAdBlock, hasGfwList) {
  // Mihomo 首个匹配的规则生效：私人直连配置在最前，最后才是 MATCH。
  const r = [
    // Loon 本地规则中的公开服务例外；私人域名、个人公网 IP 不放入公开仓库。
    "DOMAIN-SUFFIX,grok.com,Grok",
    "DOMAIN-SUFFIX,x.ai,Grok",
    ...LOON.localDirect,
    ...LOON.localProxy,
    "GEOIP,private,DIRECT,no-resolve",
    // Loon 的 AI 独立策略。按更具体的规则放在 Google 和通用 AI 规则之前。
    "DOMAIN-SUFFIX,openai.com,OpenAI",
    "DOMAIN-SUFFIX,chatgpt.com,OpenAI",
    "DOMAIN-SUFFIX,oaistatic.com,OpenAI",
    "DOMAIN-SUFFIX,oaiusercontent.com,OpenAI",
    "DOMAIN-SUFFIX,anthropic.com,Anthropic",
    "DOMAIN-SUFFIX,claude.ai,Anthropic",
    "DOMAIN,gemini.google.com,Gemini",
    "DOMAIN,aistudio.google.com,Gemini",
    "DOMAIN,generativelanguage.googleapis.com,Gemini",
    "DOMAIN-SUFFIX,grok.x.ai,Grok",
    "GEOSITE,openai,OpenAI",
    // 类似 Loon 的远程服务分流组
    "GEOSITE,youtube,YouTube",
    "GEOSITE,telegram,Telegram",
    "GEOIP,telegram,Telegram,no-resolve",
    "GEOSITE,pikpak,节点选择",
    "GEOSITE,twitter,节点选择",
    "GEOSITE,google,Gemini",
    "GEOSITE,category-ai-!cn,节点选择"
  ];
  // 原 Loon 开启去广告规则；选择上游公开 Mihomo 兼容的广告规则集。
  if (hasAdBlock) r.push("RULE-SET,LoonAdBlock,REJECT");
  r.push(
    "GEOSITE,cn,DIRECT",
    "GEOIP,cn,DIRECT,no-resolve"
  );
  if (hasGfwList) r.push("RULE-SET,LoonGFW,节点选择");
  r.push("MATCH,兜底后备策略");
  return distinct(r);
}

function main(config) {
  if (!isObject(config)) throw new Error("Clash Party 覆写需要配置对象");
  const result = { ...config };
  const providers = isObject(config["rule-providers"]) ? { ...config["rule-providers"] } : {};
  // 公开规则来源；按原版 MIT 项目使用的 provider 格式（不复制 Loon .list 私有订阅）。
  providers.LoonAdBlock = {
    type: "http", behavior: "domain", format: "mrs", interval: 86400,
    url: "https://cdn.jsdelivr.net/gh/TG-Twilight/AWAvenue-Ads-Rule@main/Filters/AWAvenue-Ads-Rule-Clash.mrs",
    path: "./ruleset/LoonAdBlock.mrs"
  };
  providers.LoonGFW = {
    type: "http", behavior: "domain", format: "yaml", interval: 86400,
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
    path: "./ruleset/LoonGFW.yaml"
  };
  result["rule-providers"] = providers;
  result["proxy-groups"] = makeGroups(config);
  result.rules = makeRules(true, true);
  result.mode = "rule";
  result.ipv6 = false;
  // 与 Loon 的 IPv4 优先 / SNI 嗅探相近；保留 Clash Party 原有 DNS 和 TUN 接管设置。
  if (isObject(config.dns)) result.dns = { ...config.dns, ipv6: false };
  if (isObject(config.sniffer)) result.sniffer = { ...config.sniffer, enable: true };
  return result;
}

globalThis.main = main;
