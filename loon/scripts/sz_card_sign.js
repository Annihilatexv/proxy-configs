/**
 * 深圳城市一卡通每日签到（Loon）
 *
 * 首次使用：开启插件中的“深圳一卡通-抓取开关”，进入 App 签到页面即可。
 * 脚本从 sign/record 查询接口提取 unionId、activityNo 及通用 x-sign，
 * 不需要点击签到；之后由 cron 组合并发送签到请求。
 *
 * 注意：x-sign 由客户端生成，脚本无法离线重算。如果服务端使签名失效，
 * 请重新开启抓取开关并再次进入签到页面，以刷新保存的请求。
 */

var NAME = "深圳城市一卡通";
var STORE_KEY = "sz_card_sign_accounts";
var CHECK_IN_URL = "https://cstapp.17u.cn/cstapi/activity/sign/checkIn";

if (typeof $request !== "undefined") {
  captureRequest();
} else {
  runTasks();
}

function captureRequest() {
  try {
    if (($request.method || "").toUpperCase() !== "POST") {
      return finish();
    }

    var requestBody = parseJSON($request.body || "");
    var sourceHeaders = $request.headers || {};
    var sign = getHeader(sourceHeaders, "x-sign");
    var referer = getHeader(sourceHeaders, "referer");
    var isRecord = /\/activity\/sign\/record(?:\?|$)/.test($request.url || "");
    var isSignPage = /^https:\/\/cstapp\.17u\.cn\/wap\/integral\/sign(?:\?|$)/.test(referer);

    // 同一查询接口可能被其他页面复用；只有签到页发出的 record 请求才保存。
    if (!isRecord || !isSignPage) {
      return finish();
    }

    var responseBody = typeof $response !== "undefined" ? parseJSON($response.body || "") : null;
    var responseData = responseBody && responseBody.data ? responseBody.data : {};
    var actConfig = responseData.actConfig || {};
    var activityNo = isRecord ? actConfig.actNo : requestBody && requestBody.activityNo;
    var unionId = requestBody && requestBody.unionId;

    if (!requestBody || !unionId || !activityNo || !sign) {
      notify(NAME, "抓取失败", "请求中缺少 unionId、activityNo 或 x-sign");
      return finish();
    }

    var checkInBody = {
      cityCode: requestBody.cityCode || "440300",
      activityNo: activityNo,
      unionId: unionId,
      traceId: requestBody.traceId || "",
      os: requestBody.os || "ios"
    };

    var accounts = loadAccounts();
    var account = {
      unionId: unionId,
      activityNo: activityNo,
      body: JSON.stringify(checkInBody),
      headers: {
        "Accept": getHeader(sourceHeaders, "accept") || "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Origin": getHeader(sourceHeaders, "origin") || "https://cstapp.17u.cn",
        "Referer": referer,
        "User-Agent": getHeader(sourceHeaders, "user-agent") || "",
        "x-sign": sign
      },
      capturedAt: new Date().toISOString(),
      capturedFrom: isRecord ? "sign/record" : "sign/checkIn"
    };

    var replaced = false;
    for (var i = 0; i < accounts.length; i++) {
      if (accounts[i].unionId === unionId) {
        accounts[i] = account;
        replaced = true;
        break;
      }
    }
    if (!replaced) accounts.push(account);

    if (!$persistentStore.write(JSON.stringify(accounts), STORE_KEY)) {
      throw new Error("写入持久化存储失败");
    }

    notify(
      NAME,
      replaced ? "凭证已更新" : "抓取成功",
      "账号 " + maskId(unionId) + "，活动 " + activityNo + "，共保存 " + accounts.length + " 个账号"
    );
  } catch (error) {
    notify(NAME, "抓取失败", errorMessage(error));
  }
  finish();
}

function runTasks() {
  var accounts = loadAccounts();
  if (!accounts.length) {
    notify(NAME, "未找到签到凭证", "请先开启抓取开关，并进入 App 签到页面一次");
    return finish();
  }

  var pending = accounts.length;
  var results = new Array(accounts.length);

  for (var i = 0; i < accounts.length; i++) {
    checkIn(accounts[i], i, function (index, message) {
      results[index] = message;
      pending--;
      if (pending === 0) {
        notify(NAME, "签到任务完成", results.join("\n"));
        finish();
      }
    });
  }
}

function checkIn(account, index, callback) {
  var label = "账号" + (index + 1) + " " + maskId(account.unionId || "");
  if (!account.body || !account.headers || !account.headers["x-sign"]) {
    return callback(index, "❌ " + label + "：保存的数据不完整，请重新抓取");
  }

  var request = {
    url: CHECK_IN_URL,
    // 统计/指纹 Cookie 对接口并非必需，部分 Loon 版本重放它时会在
    // 发出请求前直接报 HTTPClient (null)，所以运行时只保留必要头部。
    headers: buildRequestHeaders(account.headers),
    body: account.body
  };

  $httpClient.post(request, function (error, response, data) {
    if (error) {
      var networkError = errorMessage(error);
      var networkHint = /HTTPClient|timed?\s*out|timeout|null/i.test(networkError)
        ? "（请确认已刷新插件；仍失败时检查该域名是否被代理节点接管）"
        : "";
      return callback(index, "❌ " + label + "：网络错误 " + networkError + networkHint);
    }

    var result = parseJSON(data);
    if (!result) {
      return callback(index, "❌ " + label + "：返回内容不是 JSON（HTTP " + statusCode(response) + "）");
    }

    if (result.success === true && String(result.code) === "200") {
      var detail = result.data || {};
      var awards = formatAwards(detail.awardDetail);
      var date = detail.signDate ? "（" + detail.signDate + "）" : "";
      var text = "✅ " + label + "：签到成功" + date;
      if (awards) text += "，获得 " + awards;
      if (detail.signInRound != null) text += "，第 " + detail.signInRound + " 轮";
      return callback(index, text);
    }

    if (String(result.code) === "WARN_SIGNIN_001" || /今日已签到/.test(String(result.message || ""))) {
      return callback(index, "☑️ " + label + "：今日已签到");
    }

    var message = result.message || result.msg || ("接口返回 code=" + result.code);
    var hint = looksExpired(result, response)
      ? "；签名或登录态可能已失效，请重新抓取"
      : "";
    callback(index, "❌ " + label + "：" + message + hint);
  });
}

function buildRequestHeaders(savedHeaders) {
  savedHeaders = savedHeaders || {};
  return {
    "Accept": savedHeaders.Accept || "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Origin": savedHeaders.Origin || "https://cstapp.17u.cn",
    "Referer": savedHeaders.Referer || "https://cstapp.17u.cn/wap/integral/sign?platcode=10254",
    "User-Agent": savedHeaders["User-Agent"] || "",
    "x-sign": savedHeaders["x-sign"] || ""
  };
}

function loadAccounts() {
  var saved = $persistentStore.read(STORE_KEY);
  if (!saved) return [];
  var parsed = parseJSON(saved);
  return Object.prototype.toString.call(parsed) === "[object Array]" ? parsed : [];
}

function getHeader(headers, wanted) {
  var lowerWanted = wanted.toLowerCase();
  for (var key in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, key) && key.toLowerCase() === lowerWanted) {
      return headers[key];
    }
  }
  return "";
}

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function formatAwards(details) {
  if (Object.prototype.toString.call(details) !== "[object Array]") return "";
  var awards = [];
  for (var i = 0; i < details.length; i++) {
    var item = details[i] || {};
    if (item.awardName || item.awardNum) {
      awards.push((item.awardName || "奖励") + " × " + (item.awardNum || "1"));
    }
  }
  return awards.join("、");
}

function looksExpired(result, response) {
  var code = String(result.code || "");
  var message = String(result.message || result.msg || "");
  var status = statusCode(response);
  return status === 401 || status === 403 || /401|403|sign|签名|登录|失效|过期|unauthorized/i.test(code + " " + message);
}

function statusCode(response) {
  return response ? (response.status || response.statusCode || "未知") : "未知";
}

function maskId(value) {
  value = String(value || "");
  if (value.length <= 8) return value || "未知";
  return value.slice(0, 4) + "…" + value.slice(-4);
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function notify(title, subtitle, body) {
  console.log("\n[" + title + "] " + subtitle + "\n" + body);
  $notification.post(title, subtitle, body);
}

function finish() {
  $done({});
}
