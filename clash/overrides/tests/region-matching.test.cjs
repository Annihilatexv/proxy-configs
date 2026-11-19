// Run: node clash/overrides/tests/region-matching.test.cjs
// Contains only synthetic node names and placeholder URLs, no subscriptions or credentials.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../ClashParty-ProxyRules.js"), "utf8");
const context = { console: { log: () => {} } };
vm.runInNewContext(source, context, { filename: "ClashParty-ProxyRules.js" });
assert.equal(typeof context.main, "function");

const nodes = [
  "🇭🇰 [直连-香港2] ✨ 1x",
  "JP 东京 Premium",
  "日本-03",
  "🇹🇼 TW 台北01",
  "TPE-02",
  "KR 首尔 Premium",
  "🇸🇬 SG 1x",
  "SIN 新加坡 02",
  "US-NYC-01",
  "🇺🇸 美国 LA 02",
  "RackNerd US",
  "[free] HK",
  "IPLC JP"
];
const geo = {
  JP: ["JP 东京 Premium","日本-03"],
  HK: ["🇭🇰 [直连-香港2] ✨ 1x"],
  TW: ["🇹🇼 TW 台北01","TPE-02"],
  KR: ["KR 首尔 Premium"],
  SG: ["🇸🇬 SG 1x","SIN 新加坡 02"],
  US: ["US-NYC-01","🇺🇸 美国 LA 02","RackNerd US"]
};
const configs = [
  { name: "inline", proxies: nodes.map(name => ({name, type:"ss"})) },
  { name: "provider", "proxy-providers": { Airport: {type:"http",url:"https://example.invalid/a.yaml"},RackNerd:{type:"http",url:"https://example.invalid/r.yaml"} } },
  { name: "mixed", proxies: [{name:"JP 东京 Premium",type:"ss"}], "proxy-providers": {Airport:{type:"http",url:"https://example.invalid/a.yaml"}}},
  { name: "empty", proxies: [], "proxy-groups": [{name:"original",type:"select",proxies:["DIRECT"]}] }
];
for (const config of configs) {
  const result = context.main(config);
  if (config.name === "empty") {
    assert.equal(result, config, "no-source config must be preserved");
    continue;
  }
  const groups = result["proxy-groups"];
  const groupMap = Object.fromEntries(groups.map(g => [g.name,g]));
  assert.equal(groups.length, 20);
  assert.equal(groups.filter(g => !g.icon).length,0);
  const valid = new Set(["DIRECT","REJECT",...groups.map(g => g.name),...(config.proxies||[]).map(p => p.name)]);
  for (const group of groups) {
    for (const candidate of group.proxies || []) {
      assert.ok(valid.has(candidate), group.name + " refers to missing " + candidate);
    }
  }
  for (const [region,expected] of Object.entries(geo)) {
    const g = groupMap[region];
    if (config.name === "inline") {
      const actuallyListed = Array.from(g.proxies).filter(p => nodes.includes(p));
      assert.deepEqual(actuallyListed, expected, region);
      assert.ok(!g.use);
    } else if (config.name === "provider") {
      assert.equal(g.use.length,2,region+" should reference both providers");
      assert.ok(g.filter,region+" must filter provider nodes");
    } else if (config.name === "mixed") {
      assert.equal(g.use.length,1,region+" should also reference provider");
    }
  }
  assert.equal(groupMap["大碗"].proxies.join(","),"FREE_Filter,命悬一线");
  assert.ok(!groupMap["加密货币"] && !groupMap["静态资源"]);
}
console.log("PASS: explicit Loon region matching, provider-based filters, mixed sources, empty input fallback, icons and references");
