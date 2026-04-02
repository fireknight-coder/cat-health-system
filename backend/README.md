1. 健康检查 ✅
URL: http://localhost:3001/health
方法: GET
状态: ✅ 已测试通过
2. API信息
URL: http://localhost:3001/api
方法: GET
描述: 显示所有可用的API端点
3. 获取所有猫咪
URL: http://localhost:3001/api/cats
方法: GET
描述: 获取猫咪列表
4. 根据ID获取猫咪
URL: http://localhost:3001/api/cats/1
方法: GET
描述: 获取ID为1的猫咪信息
5. 创建新猫咪
URL: http://localhost:3001/api/cats
方法: POST


//开启mongodb，管理员权限

net start MongoDB
//连接数据库
"E:\mongodb-windows-x86_64-8.2.5\bin\mongosh-2.7.0-win32-x64\bin\mongosh.exe" cat-health-system

//创建数据库


