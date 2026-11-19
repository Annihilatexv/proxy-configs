// Run: node clash/overrides/tests/region-matching.test.cjs
// Synthetic node names/placeholder URLs only. Never place real subscriptions here.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = {console: {log:()=>{}}};
const source = fs.readFileSync(path.join(__dirname,"../ClashParty-ProxyRules.js"),"utf8");
vm.runInNewContext(source,context,{filename:"ClashParty-ProxyRules.js"});
assert.equal(typeof context.main,"function");

const nodes = [
  "🇭🇰 [直连-香港2] ✨ 1x","JP 东京 Premium","日本-03",
  "🇹🇼 TW 台北01","TPE-02","KR 首尔 Premium",
  "🇸🇬 SG 1x","SIN 新加坡 02","US-NYC-01",
  "🇺🇸 美国 LA 02","RackNerd US","[free] HK","IPLC JP"
];
const expectedRegion = {
  JP:["JP 东京 Premium","日本-03","IPLC JP"],
  HK:["🇭🇰 [直连-香港2] ✨ 1x"],
  TW:["🇹🇼 TW 台北01","TPE-02"],
  KR:["KR 首尔 Premium"],
  SG:["🇸🇬 SG 1x","SIN 新加坡 02"],
  US:["US-NYC-01","🇺🇸 美国 LA 02","RackNerd US"]
};
const tests = [
  {name:"all-inline-with-free",proxies:nodes.map(name=>({name,type:"ss"}))},
  {name:"inline-without-free",proxies:nodes.filter(x=>!x.includes("[free]")).map(name=>({name,type:"ss"}))},
  {name:"only-free",proxies:[{name:"[free] HK",type:"ss"}]},
  {name:"provider", "proxy-providers":{Airport:{type:"http",url:"https://example.invalid/a.yaml"},RackNerd:{type:"http",url:"https://example.invalid/r.yaml"}}},
  {name:"mixed",proxies:[{name:"JP 东京 Premium",type:"ss"}],"proxy-providers":{Airport:{type:"http",url:"https://example.invalid/a.yaml"}}},
  {name:"empty",proxies:[], "proxy-groups":[{name:"Original",type:"select",proxies:["DIRECT"]}]}
];
for (const cfg of tests) {
  const output=context.main(cfg);
  if(cfg.name==="empty"){
    assert.equal(output,cfg,"the no-source input must be left unchanged");
    continue;
  }
  const groups=output["proxy-groups"];
  const byName=Object.fromEntries(groups.map(g=>[g.name,g]));
  const providerCount=Object.keys(cfg["proxy-providers"]||{}).length;
  const hasInlineFree=(cfg.proxies||[]).some(p=>/\[free\]/i.test(p.name));
  const hasFreeSource=hasInlineFree||providerCount>0;
  assert.equal(groups.length,hasFreeSource?20:19,"unexpected count: "+cfg.name);
  assert.equal(groups.filter(g=>!g.icon).length,0,"missing icon");
  const available=new Set(["DIRECT","REJECT",...groups.map(g=>g.name),...(cfg.proxies||[]).map(p=>p.name)]);
  for(const group of groups){
    // This invariant catches the exact user-reported Mihomo parse error:
    // "proxy group[1]: FREE_Filter: use or proxies missing"
    assert.ok((group.proxies||[]).length>0||(group.use||[]).length>0,
      group.name+": use or proxies missing");
    for(const entry of group.proxies||[]){
      assert.ok(available.has(entry),group.name+" refers to nonexistent "+entry);
    }
  }
  for(const [region,expected] of Object.entries(expectedRegion)){
    const g=byName[region];
    assert.ok(g,"missing region "+region);
    if(cfg.name==="all-inline-with-free"||cfg.name==="inline-without-free"){
      const explicitlyIncluded=Array.from(g.proxies).filter(p=>nodes.includes(p));
      assert.deepEqual(explicitlyIncluded,expected,region+" missed nodes");
    }
    if(providerCount>0){
      assert.ok((g.use||[]).length>=1,region+" missing provider");
      assert.ok(g.filter,region+" missing provider filter");
    }
  }
  if(hasFreeSource){
    assert.ok(byName.FREE_Filter,"expected conditional free group");
    assert.equal(Array.from(byName["大碗"].proxies).join(","),"FREE_Filter,命悬一线");
  } else {
    assert.ok(!byName.FREE_Filter,"empty FREE_Filter must be omitted");
    assert.equal(Array.from(byName["大碗"].proxies).join(","),"命悬一线");
  }
  assert.ok(!byName["加密货币"]&&!byName["静态资源"]);
}

// Chinese simplified/traditional and protocol-prefixed node names must be recognized.
// These are synthetic examples, not actual subscription credentials.
const chineseCases=[
  ["TW","VLESS-台湾家宽"],["TW","VLESS-臺灣家寬"],
  ["TW","Hysteria2-台北01"],["TW","Trojan-臺北家寬"],
  ["HK","Trojan-香港家宽"],["HK","香港原生IP"],["HK","九龍 HKG-02"],
  ["JP","VLESS-日本家宽"],["JP","東京原生-01"],["JP","Kansai-NRT"],
  ["KR","VLESS-韩国家宽"],["KR","首爾家寬"],
  ["SG","VLESS-新加坡家宽"],["SG","狮城高端-02"],["SG","SIN-01"],
  ["US","VLESS-美国家宽"],["US","舊金山01"],["US","USA-01"]
];
const negativeCases=[
  ["TW","Thailand-01"],["US","AUS01"],["JP","JJPPremium01"],
  ["SG","Single-01"],["HK","THK01"],
  ["TW","VLESS-[free]-台湾家宽"]
];
const providerSample=context.main({
  "proxy-providers": { Airport: { type:"http",url:"https://example.invalid/a.yaml" } }
});
const providerGroups=Object.fromEntries(providerSample["proxy-groups"].map(g=>[g.name,g]));
for(const [region,name] of chineseCases){
  const inline=context.main({proxies:[{name,type:"vless"}]});
  assert.ok(inline["proxy-groups"].find(g=>g.name===region).proxies.includes(name),
    region+" should match "+name);
  const providerGroup=providerGroups[region];
  const pattern=new RegExp(providerGroup.filter.replace(/^\(\?i\)/,""),"i");
  assert.ok(pattern.test(name),region+" provider should match "+name);
}
for(const [region,name] of negativeCases){
  const inline=context.main({proxies:[{name,type:"vless"}]});
  assert.ok(!inline["proxy-groups"].find(g=>g.name===region).proxies.includes(name),
    region+" should exclude "+name);
}
console.log("PASS: Chinese simplified/traditional, protocol prefixes, provider regex and boundary negatives");


// Regress against GLOBAL vs 命悬一线 missing normal nodes. Unlike the
// strict Loon ALL_Filter, the auto group must retain actual endpoints even
// when their names contain plan/traffic/website words.
const autoCandidates = [
  "VLESS-台湾家宽-套餐A",
  "香港高速-流量加速 01",
  "🇯🇵 东京-住宅 IP",
  "US-03",
  "SG-SIN01",
  "Telegram 专线",
  "🇹🇼 台北机场节点",
  "Hysteria2-香港-官网节点",
  "US-客服转发专用线路",
  "IPLC-日本01",
  "[free] 香港"
];
const autoCfg = context.main({proxies: autoCandidates.map(name=>({name,type:"ss"}))});
const autoGroups = Object.fromEntries(autoCfg["proxy-groups"].map(g=>[g.name,g]));
const auto = autoGroups["命悬一线"];
const strict = autoGroups.ALL_Filter;
assert.ok(auto["include-all-proxies"] === true, "auto should include loaded outbound proxies");
assert.equal(auto["exclude-filter"], "(?i)\\[free\\]");
assert.equal(auto.filter, "(?i).*");
assert.equal(auto.proxies.length,autoCandidates.length - 1);
assert.ok(auto.proxies.includes("IPLC-日本01"));
assert.ok(!auto.proxies.includes("[free] 香港"));
assert.ok(strict.proxies.length < auto.proxies.length);
for (const name of autoCandidates.slice(0,10)) {
  assert.ok(auto.proxies.includes(name), "auto missing normal node " + name);
}
const autoProviderCfg=context.main({
  "proxy-providers": {Airport: {type:"http",url:"https://example.invalid/test.yaml"}}
});
const autoProvider=autoProviderCfg["proxy-groups"].find(g=>g.name==="命悬一线");
assert.ok(autoProvider["include-all-proxies"]);
assert.equal(autoProvider.use.join(","),"Airport");
console.log("PASS: auto group keeps normal nodes including IPLC; excludes only [free]");


// IPLC is now allowed in every normal region and in both auto/ALL_Filter.
// Only [free] remains an explicit exclusion for regular groups.
const ipCases=[
  ["JP","IPLC-日本 Tokyo 01"],["TW","VLESS-IPLC-台湾家宽"],
  ["HK","HK IPLC 03"],["KR","IPLC 韩国-01"],
  ["SG","IPLC-Singapore 02"],["US","IPLC US-04"]
];
const ipProviders=context.main({"proxy-providers":{
  Airport:{type:"http",url:"https://example.invalid/a.yaml"}
}});
const ipProviderMap=Object.fromEntries(ipProviders["proxy-groups"].map(g=>[g.name,g]));
for(const [country,name] of ipCases){
  const result=context.main({proxies:[{name,type:"ss"}]});
  const byName=Object.fromEntries(result["proxy-groups"].map(g=>[g.name,g]));
  assert.ok(byName[country].proxies.includes(name),country+" missing IPLC "+name);
  assert.ok(byName["命悬一线"].proxies.includes(name),"auto missing IPLC "+name);
  assert.ok(byName.ALL_Filter.proxies.includes(name),"ALL_Filter missing IPLC "+name);
  for(const key of [country,"命悬一线","ALL_Filter"]){
    const p=ipProviderMap[key];
    assert.ok(p.use.length>0,key+" missing provider reference");
    assert.ok(!(p["exclude-filter"]||"").includes("IPLC"),key+" provider excludes IPLC");
  }
}
const freeCheck=context.main({proxies:[{name:"[free] IPLC 香港",type:"ss"}]});
const byFree=Object.fromEntries(freeCheck["proxy-groups"].map(g=>[g.name,g]));
assert.ok(!byFree.HK.proxies.includes("[free] IPLC 香港"));
assert.ok(!byFree["命悬一线"].proxies.includes("[free] IPLC 香港"));
assert.ok(byFree.FREE_Filter.proxies.includes("[free] IPLC 香港"));
console.log("PASS: IPLC included in JP/HK/TW/KR/SG/US, ALL_Filter and auto, [free] remains separate");

console.log("PASS: 6 inputs; regions, providers, optional FREE_Filter, and every group has proxies/use");
