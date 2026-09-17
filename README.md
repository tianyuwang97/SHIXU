# 时序 SHIXU

度时间，探秩序。 Measure Time. Explore Order.

面向个人投资者的四市场研究工具，覆盖A股、美股、港股和基金。包含市场概览、规则筛选、同行对比、持仓诊断、退出信号检查，以及基金与A股历史演练。

**当前阶段：管理员预览版。** 暂无普通用户注册、会员支付、跨设备持仓同步或已开放的大模型分析。不自动提交交易订单。

## 访问与文档

- [在线产品](https://fund-range-daily-tiany.xiaoboss.chatgpt.site/)
- [产品手册](docs/product-manual.md)：功能入口、操作步骤、规则、登录权限及数据边界。
- [审美与交互设计要求](docs/design-principles.md)：产品设计偏好与迭代记录；具体当前行为以产品手册及代码为准。
- [管理员认证说明](AUTH-SETUP.md)：服务器端会话、密码校验与权限控制。
- [A股历史数据说明](STOCK_DATA.md)：样本范围、成交假设及数据来源。

## 本地运行

需要 Node.js 22.13 或更高版本，以及 npm。认证测试使用 Node.js 内置 SQLite。

```sh
npm ci
npm run build
npx wrangler d1 migrations apply fund-rehearsal-preview --local --config wrangler.jsonc
npm run dev
```

默认本地地址为 `http://127.0.0.1:8765/`。未设置本地管理员环境变量时，可查看公开功能，管理员登录会显示不可用。

仓库保留了当前公开数据快照，构建不等于重新采集行情。`dist/index.html` 和 `dist/site-tools.js` 目前也作为基金筛选构建输入使用，不要直接删除整个 `dist` 目录。

## 功能与目录

| 模块 | 主要文件 |
| --- | --- |
| Worker 与接口路由 | `worker.mjs` |
| 首页与候选展示 | `simulation/home.html`、`home-picks.js` |
| 指数概览 | `market-indices.js`、`market-indices-api.mjs` |
| 四市场统一规则核心（30天／前15天） | `fixed-window-rules.cjs` |
| 买入候选规则 | `stock-picks-core.mjs`、`stock-picks-breakout.cjs` |
| 退出规则与主题过渡 | `stock-exits-core.mjs`、`stock-picks-breakdown.cjs`、`exit-mode.js` |
| 股票与基金对比 | `stock-peers.js`、`compare.js` |
| 持仓诊断与研究记录 | `portfolio-core.mjs`、`portfolio.js`、`research-store.mjs` |
| 管理员会话 | `admin-auth.mjs`、`stock-rule-access.mjs` |
| 历史演练 | `sim-engine.mjs`、`stock-engine.mjs`、`simulation/` |
| 数据库迁移 | `drizzle/` |
| 构建与部署输出 | `build.mjs`、`dist/client/`、`dist/server/` |

`.generated/` 由构建生成，用于服务器端的规则数据打包，不纳入 Git。`node_modules/`、本地数据库状态与本地凭据同样不提交。

## 验证

先执行构建，再运行现有的认证及退出规则测试：

```sh
node --test --test-isolation=none auth-access.test.mjs stock-exits.test.mjs fixed-window-rules.test.mjs
```

测试覆盖管理员认证与会话撤销、接口权限、固定区间边界、连续收盘确认、重新涨回后的信号处理、双规则同时满足及基金分红口径等。

## 部署与配置

现有正式站通过 Sites 发布，项目关联保存在 `.openai/hosting.json`。`wrangler.jsonc` 用于本地预览，其中的 `local-preview-only` 不是可直接用于正式部署的 Cloudflare 数据库 ID。

管理员认证需要运行时配置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD_VERIFIER`，以及 `DB` 数据库绑定。密码校验值采用随机盐的 PBKDF2-SHA256，配置在部署平台的 Secret 中，不写入前端或 Git。详见 [AUTH-SETUP.md](AUTH-SETUP.md)。

GitHub 代码提交不会自动修改现有正式站；本项目尚未配置 GitHub Actions 自动部署流程。请沿用已有 Sites 发布过程，或在明确迁移部署平台后另行配置。

## 数据与使用边界

- 行情和财务数据按各页面标注的来源、日期与覆盖范围展示，不能将候选池当作完整实时市场。
- 双规则候选只表示指定条件成立，不是保证收益的建议；退出规则尚未完成收益回测。
- 持仓调整金额依据用户填写的市值与边界计算，不含实际成交成本，也不调用大模型。
- 自选与持仓主要保存在当前浏览器；演练存档依赖浏览器匿名身份，暂不支持账号跨设备恢复。
- 历史演练为固定样本、虚拟资金和教学成交假设，不等同于真实交易或完整策略回测。

第三方市场数据与图片素材的使用范围应分别核对。仓库未另外声明开放源代码许可。
