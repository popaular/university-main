# 🎓 大学申请追踪系统

一个完整的大学申请管理平台，帮助学生、家长追踪大学申请进度，支持多角色权限管理。

## ✨ 功能特性

### 🎯 核心功能
- **大学搜索与筛选**：支持按地理位置、排名、录取率等筛选
- **申请进度追踪**：可视化申请管道和状态管理
- **截止日期管理**：智能提醒和视觉警报
- **要求清单**：每所大学的申请要求追踪

### 👥 用户角色
- **学生**：管理个人申请组合，完整CRUD权限
- **家长**：监控孩子申请状态，只读+备注权限
- **老师**：指导多个学生（未来扩展）

### 📊 仪表板
- **学生仪表板**：申请概览、截止日期日历、进度统计
- **家长仪表板**：孩子申请监控、财务规划

## 🛠️ 技术栈

### 前端
- **Next.js 15** - React全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 现代化样式
- **Radix UI** - 无障碍组件

### 后端
- **Next.js API Routes** - 内置API路由
- **Prisma** - 现代化ORM
- **PostgreSQL** - 关系型数据库
- **JWT** - 身份认证

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL数据库（本地或Railway云端）

### 安装步骤

1. **进入项目目录**
```bash
cd /Users/oulongbo/Downloads/trae/job-take-home/university-tracker
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
# Railway PostgreSQL（已配置）
DATABASE_URL="postgresql://postgres:VuNnCtyxUoBxtNBZVKSUpuhJUOvoxYqS@nozomi.proxy.rlwy.net:55320/railway"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 📊 数据库推送完整指南

#### ✅ 成功推送步骤

1. **安装认证依赖**
```bash
npm install bcryptjs @types/bcryptjs jsonwebtoken @types/jsonwebtoken
```

2. **推送数据库结构**
```bash
# 直接推送（推荐）
npx prisma db push

# 或使用npm脚本
npm run db:push
```

3. **验证推送结果**
```bash
# 启动数据库管理界面
npm run db:studio
# 访问 http://localhost:5555
```

4. **填充种子数据**
```bash
npm run db:seed
```

#### 🚨 常见问题及解决方案

**问题1：Prisma关系验证错误**
```
Error: "parentChildren" field is missing the opposite relation field
```
**解决**：
- 已在 `schema.prisma` 中为User模型添加正确的关系字段
- 运行 `npm run db:push -- --accept-data-loss` 强制推送

**问题2：复合唯一约束错误**
```
Error: Unknown argument `studentId_universityId`
```
**解决**：
- 修改 `seed.ts` 中的upsert查询条件
- 使用 `id` 字段替代复合唯一约束

**问题3：构建错误**
```
Error: 'Plus' was used before it was defined
```
**解决**：
- 修复 `student-dashboard.tsx` 中的重复导入
- 合并重复的 `lucide-react` 导入

#### 🔄 完整数据库操作流程

```bash
# 1. 推送数据库结构
npx prisma db push

# 2. 生成Prisma客户端
npm run db:generate

# 3. 填充种子数据
npm run db:seed

# 4. 验证数据
npm run db:studio
```

### 测试账号
- **学生**：`student@example.com` / `password`
- **家长**：`parent@example.com` / `password`

### 🌐 数据库访问
- **Prisma Studio**：http://localhost:5555
- **本地开发**：http://localhost:3000

## 🧪 开发命令

```bash
# 开发模式
npm run dev

# 数据库操作
npm run db:generate      # 生成Prisma客户端
npm run db:migrate       # 运行迁移
npm run db:push          # 推送schema
npm run db:seed          # 种子数据
npm run db:studio        # 数据库管理界面

# 构建和部署
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
npm run lint             # 代码检查
```

## 🔧 故障排除

### 数据库连接问题
```bash
# 检查数据库连接
npx prisma db execute --command "SELECT 1"

# 重置数据库（谨慎使用）
npx prisma migrate reset

# 查看数据库状态
npx prisma db pull
```

### 依赖问题
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 更新Prisma
npm update @prisma/client prisma
```

### 环境变量检查
```bash
# 验证环境变量
node -e "console.log(require('dotenv').config({path: '.env'}))"
```

### 常见错误代码
- **Exit Code 1**: 语法错误或类型错误，检查代码
- **Exit Code 137**: 内存不足，重启系统
- **Prisma错误**: 检查schema.prisma语法

## 📞 技术支持

如遇到问题：
1. 检查 [Issues](https://github.com/popaular/university-tracker/issues)
2. 查看 [Prisma文档](https://www.prisma.io/docs/)
3. 参考 [Next.js文档](https://nextjs.org/docs)
