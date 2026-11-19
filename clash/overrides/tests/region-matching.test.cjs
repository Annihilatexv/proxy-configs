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
  JP:["JP 东京 Premium","日本-03"],
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
console.log("PASS: 6 inputs; regions, providers, optional FREE_Filter, and every group has proxies/use");
