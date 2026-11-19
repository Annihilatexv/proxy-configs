// Regression test: run with `node clash/overrides/tests/region-matching.test.cjs`
// Synthetic node names only. No personal subscription data or network access.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../ClashParty-ProxyRules.js"), "utf8");
const sandbox = {};
vm.runInNewContext(script, sandbox, { filename: "ClashParty-ProxyRules.js" });
assert.equal(typeof sandbox.main, "function");
const main = sandbox.main;

function accepts(group, name) {
  const compile = (pattern) => new RegExp(pattern.replace(/^\(\?i\)/, ""), "i");
  return compile(group.filter).test(name) && !compile(group["exclude-filter"] || "(?!)").test(name);
}

const samples = [
  ["🇭🇰 HKG-01 官网订阅", "HK"],
  ["JP 东京 Premium 02", "JP"],
  ["🇯🇵 Tokyo-NRT 03", "JP"],
  ["🇺🇸 US-USA 网站 04", "US"],
  ["SG-SIN 流量 05", "SG"],
  ["🇹🇼 TPE08 套餐", "TW"],
  ["KR 首尔 06", "KR"],
  ["[free] HK 07", null],
  ["IPLC 日本 08", null],
];
const cases = [
  { proxies: samples.map(([name]) => ({ name, type: "ss" })) },
  { "proxy-providers": { Airport: { type: "http", url: "https://example.invalid/a.yaml", path: "./a.yaml" } } },
  { "proxy-providers": {
      RackNerd: { type: "http", url: "https://example.invalid/r.yaml", path: "./r.yaml" },
      Airport: { type: "http", url: "https://example.invalid/a.yaml", path: "./a.yaml" }
    } },
  { proxies: [] },
];
for (const [index, config] of cases.entries()) {
  const result = main(config);
  const groups = result["proxy-groups"];
  const map = Object.fromEntries(groups.map(group => [group.name, group]));
  assert.equal(groups.length, 20, "unexpected group count");
  assert.equal(groups.filter(g => !g.icon).length, 0, "missing icon");
  const inlineNames = new Set((config.proxies || []).map(proxy => proxy.name));
  for (const group of groups) {
    for (const item of group.proxies || [])
      assert.ok(item === "DIRECT" || item === "REJECT" || map[item] || inlineNames.has(item), item + " missing");
  }
  for (const region of ["JP", "HK", "TW", "KR", "SG", "US"]) {
    const group = map[region];
    assert.equal(group["include-all"], true);
    assert.equal(group["exclude-filter"], "(?i)IPLC|\\[free\\]");
    assert.ok(!(group.proxies || []).includes("命悬一线"));
  }
  assert.ok(!map["加密货币"] && !map["静态资源"]);
  assert.equal(map["大碗"].proxies.join(","), "FREE_Filter,命悬一线");
  if (index === 0) {
    for (const [name, intendedRegion] of samples) {
      const hits = ["JP", "HK", "TW", "KR", "SG", "US"].filter(region => accepts(map[region], name));
      assert.deepEqual(hits, intendedRegion ? [intendedRegion] : [], name);
    }
  }
  if (index === 1) assert.deepEqual(Array.from(map.US.proxies), []);
  if (index === 2) assert.equal(map.RackNerd.use.join(","), "RackNerd");
}
console.log("PASS: 4 source shapes, 9 node-name samples, valid groups/icons and Loon region exclusions");
