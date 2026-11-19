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
    // 保留 Loon 的中文/英文匹配，并补充常见机场代码与国旗。
    JP: "日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan|JPN|Tokyo|Osaka|NRT|HND|KIX|TYO|OSA|🇯🇵",
    US: "美|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|US|USA|United States|America|LAX|SFO|JFK|SEA|NYC|🇺🇸",
    HK: "港|HK|Hong|HKG|Kowloon|🇭🇰",
    TW: "台|TW|Tai|TPE|TWN|🇹🇼",
    KR: "KR|Korea|KOR|首尔|韩|韓|Seoul|ICN|🇰🇷",
    SG: "新加坡|坡|狮城|SG|Singapore|SIN|🇸🇬"
  },
  // 与 Loon 中的免费/IPLC/订阅信息过滤方式相近；不使用 Go RE2 不支持的环视语法。
  freePattern: "\\[free\\]",
  excludePattern: "\\[free\\]|IPLC|官网|客服|网站|网址|订阅|流量|到期|过期|已用|邀请|返利|邮箱|工单|通知|频道|交流群|教程|联系|剩余|提示|套餐|((USE|USED|TOTAL|EXPIRE|EMAIL|Traffic)[0-9]*)",
  localDirect: [
    "DOMAIN-SUFFIX,linuxdo.org,DIRECT",
    "DOMAIN-SUFFIX,speedtest.net,DIRECT",
    "DOMAIN-SUFFIX,qq.com,DIRECT",
    "DOMAIN-SUFFIX,bing.com,DIRECT",
    "DOMAIN-SUFFIX,bing.cn,DIRECT"
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

// 图标优先沿用 Loon：GitHub Raw 源，避免 jsDelivr 分支缓存；全部核对过仓库中的实际图片。
const QURE_ICON = "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/";
const ICONS = {
  "节点选择": QURE_ICON + "Available.png",
  "OpenAI": QURE_ICON + "ChatGPT.png",
  "Anthropic": "https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/Claude.png",
  "Gemini": "https://raw.githubusercontent.com/fmz200/wool_scripts/main/icons/apps/Gemini_01.png",
  "Grok": "https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/Grok.png",
  "Linux.do": "https://raw.githubusercontent.com/lsimply/icons/main/png/linux.png",
  "YouTube": QURE_ICON + "YouTube.png",
  "Telegram": QURE_ICON + "Telegram.png",
  "RackNerd": QURE_ICON + "Heart.png",
  "JP": QURE_ICON + "Japan.png",
  "US": QURE_ICON + "United_States.png",
  "HK": QURE_ICON + "Hong_Kong.png",
  "TW": QURE_ICON + "Taiwan.png",
  "KR": QURE_ICON + "Korea.png",
  "SG": QURE_ICON + "Singapore.png",
  "大碗": QURE_ICON + "Available_1.png",
  "命悬一线": "https://raw.githubusercontent.com/Orz-3/mini/master/Color/Cylink.png",
  "兜底后备策略": QURE_ICON + "Available.png",
  "ALL_Filter": QURE_ICON + "Proxy.png"
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
  if (ICONS[name]) group.icon = ICONS[name];
  // include-all 由 Mihomo 在运行时注入节点，不能提前用 DIRECT 占位。
  if (!group.proxies.length && !group.use && !group["include-all"]) group.proxies = ["DIRECT"];
  groups.push(group);
}

function makeGroups(source) {
  const providerNames = isObject(source["proxy-providers"])
    ? Object.keys(source["proxy-providers"])
    : [];
  const inlineNodeNames = Array.isArray(source.proxies)
    ? source.proxies.filter(n => isObject(n) && typeof n.name === "string").map(n => n.name)
    : [];

  const groups = [];
  const add = (name, type, proxies = [], options = {}) =>
    addGroup(groups, name, type, proxies, options);

  // 服务组严格按 Loon 的默认选项顺序。
  add("节点选择", "select", ["命悬一线", "大碗", "US", "HK", "TW", "JP", "KR", "SG", "ALL_Filter", "DIRECT"]);
  add("OpenAI", "select", ["JP", "节点选择", "US", "SG"]);
  add("Anthropic", "select", ["US", "节点选择", "SG", "JP"]);
  add("Gemini", "select", ["US", "节点选择", "SG", "JP"]);
  add("Grok", "select", ["US", "节点选择", "SG", "JP"]);
  add("Linux.do", "select", ["节点选择", "JP", "US", "SG", "KR", "HK", "TW"]);
  add("YouTube", "select", ["大碗", "节点选择"]);
  add("Telegram", "select", ["DIRECT", "大碗", "节点选择", "US"]);

  // 自动加载由 Mihomo 内核完成，不能根据 JS 阶段 proxies 数组的数量判断节点是否为空。
  const common = { "include-all": true, "exclude-type": "direct", "empty-fallback": "COMPATIBLE" };
  const normalExclude = "(?i)" + LOON.excludePattern;
  add("ALL_Filter", "select", [], {
    ...common, filter: ".*", "exclude-filter": normalExclude
  });
  add("命悬一线", "url-test", [], {
    ...common, filter: ".*", "exclude-filter": normalExclude,
    interval: 600, tolerance: 50
  });

  // 重要：Loon 的地区过滤器只排除 [free] 和 IPLC；
  // 不能像旧版那样误用 ALL_Filter 的宽泛 excludePattern，否则会漏掉大量地区节点。
  const regionExclude = "(?i)IPLC|\\[free\\]";
  const regionOptions = (key) => ({
    ...common, filter: "(?i)" + LOON.regionPattern[key],
    "exclude-filter": regionExclude
  });
  for (const name of ["JP", "HK", "TW", "KR", "SG"]) {
    add(name, name === "KR" ? "select" : "url-test", [], {
      ...regionOptions(name),
      ...(name === "KR" ? {} : { interval: 600, tolerance: name === "TW" ? 30 : 50 })
    });
  }

  // 仅在可识别出 RackNerd 的提供者/节点时让 US 优先尝试它。
  // 不凭空把一个无节点的 RackNerd 组放到 US 组最前面。
  const rackProviders = providerNames.filter(n => /rack[ _-]?nerd/i.test(n));
  const hasRackNode = inlineNodeNames.some(n => /rack[ _-]?nerd/i.test(n));
  if (rackProviders.length) {
    add("RackNerd", "url-test", [], {
      use: rackProviders, "exclude-filter": regionExclude,
      "empty-fallback": "COMPATIBLE", interval: 300, tolerance: 50
    });
  } else {
    add("RackNerd", "url-test", [], {
      ...common, filter: "(?i)Rack[ _-]?Nerd", "exclude-filter": regionExclude,
      interval: 300, tolerance: 50
    });
  }
  add("US", "fallback", rackProviders.length || hasRackNode ? ["RackNerd"] : [], {
    ...regionOptions("US"), interval: 600
  });

  // 免费节点独立匹配，仅当 [free] 组失效后才使用常规节点。
  add("FREE_Filter", "url-test", [], {
    ...common, filter: "(?i)\\[free\\]",
    "empty-fallback": "REJECT", hidden: true,
    icon: ICONS["大碗"], interval: 300, tolerance: 50
  });
  add("大碗", "fallback", ["FREE_Filter", "命悬一线"], { interval: 300 });
  add("兜底后备策略", "fallback", ["HK", "TW", "JP", "KR", "SG", "US", "命悬一线"], { interval: 60 });
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
  result.sniffer = isObject(config.sniffer) ? { ...config.sniffer, enable: true } : {
    enable: true,
    sniff: { TLS: { ports: [443, 8443] }, HTTP: { ports: [80, 8080] } },
    "override-destination": false
  };
  return result;
}

globalThis.main = main;
