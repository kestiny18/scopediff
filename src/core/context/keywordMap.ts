export const domainKeywords: Record<string, string[]> = {
  auth: [
    "auth",
    "login",
    "signin",
    "password",
    "token",
    "session",
    "authenticate",
    "authentication",
    "登录",
    "认证",
    "密码",
    "令牌",
    "会话"
  ],
  payment: [
    "payment",
    "billing",
    "invoice",
    "checkout",
    "subscription",
    "order",
    "支付",
    "账单",
    "订单",
    "订阅",
    "结账"
  ],
  database: [
    "database",
    "db",
    "migration",
    "migrations",
    "schema",
    "sql",
    "repository",
    "数据库",
    "表结构",
    "迁移",
    "建表"
  ],
  dependency: [
    "dependency",
    "dependencies",
    "package",
    "upgrade",
    "build",
    "bundle",
    "依赖",
    "升级",
    "构建",
    "打包"
  ],
  ci: [
    "ci",
    "cd",
    "workflow",
    "deploy",
    "deployment",
    "pipeline",
    "action",
    "部署",
    "发布",
    "流水线"
  ],
  docs: [
    "docs",
    "readme",
    "documentation",
    "guide",
    "文档",
    "说明"
  ]
};

export const refactorKeywords = [
  "refactor",
  "rename",
  "renaming",
  "naming",
  "cleanup",
  "restructure",
  "重构",
  "重命名",
  "改名"
];

export const broadChangeKeywords = [
  ...refactorKeywords,
  "feature",
  "redesign",
  "rework",
  "功能",
  "改造"
];
