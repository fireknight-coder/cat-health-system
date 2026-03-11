// testUser.js - 测试数据库中的用户状态
import { MongoClient } from "mongodb";

async function testUser() {
  const client = new MongoClient("mongodb://localhost:27017");
  
  try {
    console.log("🔍 正在连接到MongoDB...");
    await client.connect();
    console.log("✅ MongoDB连接成功");
    
    const database = client.db("cat_management");
    const users = database.collection("users");
    
    // 查询所有用户
    const allUsers = await users.find({}).toArray();
    console.log("🔍 数据库中的所有用户:");
    console.log("总用户数:", allUsers.length);
    
    allUsers.forEach((user, index) => {
      console.log(`\n--- 用户 ${index + 1} ---`);
      console.log("   - 用户名:", user.username);
      console.log("   - 邮箱:", user.email);
      console.log("   - 角色:", user.role);
      console.log("   - 状态:", user.status);
      console.log("   - 是否激活:", user.isActive);
      console.log("   - 密码长度:", user.password ? user.password.length : "null");
      console.log("   - 密码前缀:", user.password ? user.password.substring(0, 20) + "..." : "null");
    });
    
    // 特别查询fireknight用户
    const fireknight = await users.findOne({ username: "fireknight" });
    console.log("\n🔍 fireknight用户详细信息:");
    if (fireknight) {
      console.log("   - 找到fireknight用户");
      console.log("   - 完整用户信息:", JSON.stringify(fireknight, null, 2));
    } else {
      console.log("   - 未找到fireknight用户");
    }
    
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
    console.error("详细错误信息:", error);
  } finally {
    await client.close();
    console.log("\n🔍 MongoDB连接已关闭");
  }
}

testUser();