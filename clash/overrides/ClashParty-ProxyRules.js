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
  // 与 Loon 兼容：中文简繁体（含 VLESS-台湾家宽 等前后缀）、城市、机场码及国旗。
  // 英文缩写/机场代码需非字母边界，避免 SIN 误命中 Single、US 误命中 AUS。
  regionPattern: {
    JP: "日本|川日|东京|東京|大阪|泉日|埼玉|沪日|深日|关西|關西|京都|名古屋|北海道|札幌|福冈|福岡|冲绳|沖繩|横滨|橫濱|神户|神戶|千叶|千葉|Japan|Japanese|Tokyo|Osaka|Kansai|Kyoto|Nagoya|Sapporo|Fukuoka|Yokohama|Okinawa|(?:^|[^A-Za-z])(?:JP|JPN|NRT|HND|KIX|ITM|NGO|FUK|CTS|TYO|OSA)(?:[0-9]+|[^A-Za-z]|$)|🇯🇵",
    US: "美国|美國|美|波特兰|波特蘭|达拉斯|達拉斯|俄勒冈|俄勒岡|凤凰城|鳳凰城|费利蒙|費利蒙|硅谷|矽谷|拉斯维加斯|拉斯維加斯|洛杉矶|洛杉磯|圣何塞|聖荷西|圣克拉拉|聖克拉拉|西雅图|西雅圖|芝加哥|纽约|紐約|旧金山|舊金山|迈阿密|邁阿密|亚特兰大|亞特蘭大|华盛顿|華盛頓|波士顿|波士頓|休斯敦|休士頓|United States|UnitedStates|United_States|United-States|America|American|Los Angeles|New York|Seattle|San Francisco|Silicon Valley|Chicago|Dallas|Portland|Las Vegas|Washington|Boston|Miami|Houston|Atlanta|Phoenix|(?:^|[^A-Za-z])(?:US|USA|NYC|LAX|SFO|SEA|SJC|EWR|DFW|ATL|JFK|IAD|ORD|MIA|SLC|PDX|LAS|BOS)(?:[0-9]+|[^A-Za-z]|$)|🇺🇸",
    HK: "香港|港|深港|九龙|九龍|新界|沙田|荃湾|荃灣|葵涌|湾仔|灣仔|将军澳|將軍澳|观塘|觀塘|九龙湾|九龍灣|Hong Kong|HongKong|Hong_Kong|Hong-Kong|Kowloon|(?:^|[^A-Za-z])(?:HK|HKG)(?:[0-9]+|[^A-Za-z]|$)|🇭🇰",
    TW: "台湾|台灣|臺灣|台|臺北|台北|新北|台中|臺中|台南|臺南|高雄|桃园|桃園|彰化|基隆|Taiwan|Taipei|Taichung|Tainan|Kaohsiung|Taoyuan|(?:^|[^A-Za-z])(?:TW|TWN|TPE|KHH|ROC|Tai)(?:[0-9]+|[^A-Za-z]|$)|🇹🇼",
    KR: "韩国|韓國|韩|韓|首尔|首爾|仁川|釜山|春川|大邱|大田|济州|濟州|Korea|South Korea|SouthKorea|Seoul|Incheon|Busan|Chuncheon|Jeju|(?:^|[^A-Za-z])(?:KR|KOR|ICN|GMP|PUS|CJU)(?:[0-9]+|[^A-Za-z]|$)|🇰🇷",
    SG: "新加坡|星加坡|狮城|獅城|坡|樟宜|新国|新國|Singapore|Singapura|Changi|(?:^|[^A-Za-z])(?:SG|SGP|SIN)(?:[0-9]+|[^A-Za-z]|$)|🇸🇬"
  },
  // 与 Loon 中的免费/IPLC/订阅信息过滤方式相近；不使用 Go RE2 不支持的环视语法。
  freePattern: "\\[free\\]",
  // 命悬一线仅排除 Loon 明确区分的免费/IPLC；不再误伤带“套餐/流量”等字样的正常节点。
  autoExcludePattern: "\\[free\\]|IPLC",
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
  // Mihomo requires at least one concrete proxies or use entry.
  // empty-fallback only controls an already-valid group's runtime behavior;
  // it does NOT make an empty group valid during config parsing.
  if (!group.proxies.length && !(Array.isArray(group.use) && group.use.length)) {
    group.proxies = ["ALL_Filter", "命悬一线"].includes(group.name)
      ? ["DIRECT"]
      : ["命悬一线"];
    if (typeof console !== "undefined" && console.log) {
      console.log("[Loon-override] no matching source for " + group.name
        + "; set safe group fallback");
    }
  }
  groups.push(group);
}

function makeGroups(source) {
  // Split the sources: materialize inline nodes in JS and use Mihomo provider filtering for deferred nodes.
  const inlineProxies = Array.isArray(source.proxies)
    ? source.proxies.filter(x => isObject(x) && typeof x.name === "string" && x.name)
    : [];
  const providerNames = isObject(source["proxy-providers"])
    ? Object.keys(source["proxy-providers"])
    : [];
  const groups = [];
  const add = (name, type, proxies = [], options = {}) =>
    addGroup(groups, name, type, proxies, options);
  function pick(pattern, excluded = "") {
    const include = new RegExp(pattern, "i");
    const exclude = excluded ? new RegExp(excluded, "i") : null;
    return distinct(inlineProxies.map(x => x.name).filter(name =>
      include.test(name) && !(exclude && exclude.test(name))));
  }
  // Explicit proxies are selected by JS; provider nodes by native use + filter.
  function addFiltered(name, type, pattern, excluded, options = {}) {
    const entries = pick(pattern, excluded);
    const providerOptions = providerNames.length
      ? { use: providerNames.slice(), filter: "(?i)" + pattern,
          ...(excluded ? { "exclude-filter": "(?i)" + excluded } : {}) }
      : {};
    add(name, type, entries, {
      "empty-fallback": "COMPATIBLE",
      ...providerOptions, ...options
    });
  }
  add("节点选择", "select", ["命悬一线","大碗","US","HK","TW","JP","KR","SG","ALL_Filter","DIRECT"]);
  add("OpenAI", "select", ["JP","节点选择","US","SG"]);
  add("Anthropic", "select", ["US","节点选择","SG","JP"]);
  add("Gemini", "select", ["US","节点选择","SG","JP"]);
  add("Grok", "select", ["US","节点选择","SG","JP"]);
  add("Linux.do", "select", ["节点选择","JP","US","SG","KR","HK","TW"]);
  add("YouTube", "select", ["大碗","节点选择"]);
  add("Telegram", "select", ["DIRECT","大碗","节点选择","US"]);

  const normalExclude = LOON.excludePattern;
  const regionExclude = "IPLC|\\[free\\]";
  addFiltered("ALL_Filter", "select", ".*", normalExclude);
  // 与 GLOBAL 的普通节点来源对齐：显式节点 + 所有已声明的 Provider。
  // 额外 include-all-proxies 可覆盖 JS 阶段未看到、但内核已加载的顶层代理。
  // 注意这仍不同于 GLOBAL（后者还包含策略组以及 free/IPLC 等特殊节点）。
  addFiltered("命悬一线", "url-test", ".*", LOON.autoExcludePattern,
    {
      interval: 600, tolerance: 50,
      "include-all-proxies": true,
      filter: "(?i).*",
      "exclude-filter": "(?i)" + LOON.autoExcludePattern,
      "exclude-type": "direct"
    });
  for (const name of ["JP","HK","TW","KR","SG"]) {
    addFiltered(name, name === "KR" ? "select" : "url-test",
      LOON.regionPattern[name], regionExclude,
      name === "KR" ? {} : { interval: 600, tolerance: name === "TW" ? 30 : 50 });
  }
  const rackProviders = providerNames.filter(name => /rack[\s_-]?nerd/i.test(name));
  const rackInline = pick("rack[\\s_-]?nerd", regionExclude);
  const rackOptions = rackProviders.length
    ? { use: rackProviders }
    : providerNames.length
      ? { use: providerNames, filter: "(?i)rack[\\s_-]?nerd",
          "exclude-filter": "(?i)" + regionExclude }
      : {};
  add("RackNerd", "url-test", rackInline, {
    "empty-fallback": "COMPATIBLE", interval: 300, tolerance: 50, ...rackOptions
  });
  const rackSelected = rackProviders.length > 0 || rackInline.length > 0;
  const usNodes = pick(LOON.regionPattern.US, regionExclude);
  const usOptions = providerNames.length
    ? { use: providerNames, filter: "(?i)" + LOON.regionPattern.US,
        "exclude-filter": "(?i)" + regionExclude }
    : {};
  add("US", "fallback", distinct([
    ...(rackSelected ? ["RackNerd"] : []), ...usNodes
  ]), { "empty-fallback": "COMPATIBLE", interval: 600, ...usOptions });

  // Do not generate an empty FREE_Filter group: Mihomo rejects a group
  // without proxies/use even when empty-fallback has been provided.
  // When a provider exists, its [free] nodes are filtered at runtime.
  const freeEntries = pick("\\[free\\]");
  const hasFreeSource = freeEntries.length > 0 || providerNames.length > 0;
  if (hasFreeSource) {
    addFiltered("FREE_Filter", "url-test", "\\[free\\]", "", {
      "empty-fallback": "REJECT", interval: 300, tolerance: 50,
      hidden: true, icon: ICONS["大碗"]
    });
  }
  add("大碗", "fallback", hasFreeSource
    ? ["FREE_Filter", "命悬一线"]
    : ["命悬一线"], { interval: 300 });
  add("兜底后备策略", "fallback",
    ["HK","TW","JP","KR","SG","US","命悬一线"], { interval: 60 });
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
  // Safeguard: never replace original working groups when no node sources are visible.
  const inlineCount = Array.isArray(config.proxies) ? config.proxies.length : 0;
  const providerCount = isObject(config["proxy-providers"])
    ? Object.keys(config["proxy-providers"]).length : 0;
  const originalGroupCount = Array.isArray(config["proxy-groups"]) ? config["proxy-groups"].length : 0;
  if (typeof console !== "undefined" && console.log) {
    console.log("[Loon-override] input " + JSON.stringify({
      inlineCount, providerCount, originalGroupCount
    }));
  }
  if (inlineCount === 0 && providerCount === 0) {
    if (typeof console !== "undefined" && console.log) {
      console.log("[Loon-override] no node source; retaining original config");
    }
    return config;
  }
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
  if (typeof console !== "undefined" && console.log) {
    const regionNames = ["JP", "HK", "TW", "KR", "SG", "US", "ALL_Filter", "命悬一线"];
    const groupStats = {};
    for (const g of result["proxy-groups"]) {
      if (regionNames.includes(g.name)) {
        groupStats[g.name] = { explicit: g.proxies?.length || 0, providerRefs: g.use?.length || 0 };
      }
    }
    console.log("[Loon-override] group source counts " + JSON.stringify(groupStats));
  }
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
