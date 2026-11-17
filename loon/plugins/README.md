# Loon 远程插件

本目录由本地 Loon 插件迁移而来，保留原作者署名。

## 插件

- [签到任务合集](https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/loon/plugins/jambo_signin.plugin)
- [去广告合集](https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/loon/plugins/jambo_ad_cleaner.plugin)
- [应用解锁合集](https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/loon/plugins/jambo_app_tools.plugin)（迁移时默认停用）
- [本机开发服务回环](https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/loon/plugins/jambo_localdev_loopback.plugin)（Loon 3.5.3 Build 1007+，TUN Only）

签到合集所需的酷我积分和深圳一卡通脚本位于 `loon/scripts/`，插件使用绝对 Raw URL 引用。其他第三方脚本继续使用原作者地址。

Cookie/签到凭证在设备的 Loon 持久化存储中保存，不属于仓库文件。主配置、节点订阅、MITM 私钥和个人备份不上传。

更新插件后，请在 Loon 刷新插件与脚本缓存。首次从本地插件切换到远程 URL 时，请核对参数和定时设置；原有设备持久化凭证无需迁入仓库。
