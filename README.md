# Proxy Configs

个人使用的 **Loon**、**Clash Party / Mihomo** 规则、图标和配置文件仓库，主要用于通过 GitHub Raw URL 远程引用。

> 目前仅完成目录初始化，尚未上传可直接使用的完整代理配置、订阅节点或规则集。

## 目录结构

```text
proxy-configs/
├── loon/
│   ├── config/       # Loon 主配置 (.conf)
│   ├── rules/        # Loon 规则集 (.list)
│   ├── plugins/      # Loon 插件 (.plugin)
│   └── scripts/      # Loon 脚本 (.js)
├── clash/
│   ├── config/       # Clash Party / Mihomo 配置 (.yaml)
│   ├── rules/        # 远程规则文件
│   └── providers/    # 规则提供者等复用文件
├── icons/
│   ├── apps/         # App 图标
│   └── services/     # 服务/策略组图标
└── README.md
```

## 远程引用

公开仓库中的实际文件可使用以下格式访问：

```text
https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/<路径>
```

**路径示例（仅作格式演示，文件尚未创建）：**

- Loon 规则：`https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/loon/rules/example.list`
- Loon 插件：`https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/loon/plugins/example.plugin`
- Clash 规则：`https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/clash/rules/example.yaml`
- 图标：`https://raw.githubusercontent.com/Annihilatexv/proxy-configs/main/icons/apps/example.png`

> 请将示例文件名替换为仓库中真实存在的文件，并在客户端按对应的配置语法引用。GitHub Raw 只提供文件 URL，并不自动将不同客户端的规则格式互相转换。

## 使用与安全

- **不要提交**包含订阅 Token、API 密钥、用户名密码、代理节点凭据的配置文件。
- 公共规则、策略组图标、通用脚本适合放到本仓库；包含个人凭据的完整配置应保留在本地或安全的私有存储中。
- 图标尽量使用稳定的相对路径，避免重命名导致远程引用失效。
- 修改已订阅文件后，客户端可能需要手动刷新或等待其更新周期。
- 暂时使用 `.gitkeep` 保留空目录；实际文件添加后可以删掉这些占位文件。
