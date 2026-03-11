import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

async function cleanAndCreate() {
  const client = new MongoClient("mongodb://localhost:27017");
  
  try {
    console.log("🔍 正在连接到MongoDB...");
    await client.connect();
    console.log("✅ MongoDB连接成功");
    
    const database = client.db("cat_management");
    const users = database.collection("users");
    
    // 1. 删除所有fireknight用户
    console.log("🗑️  正在删除所有fireknight用户...");
    const deleteResult = await users.deleteMany({ username: "fireknight" });
    console.log("✅ 已删除", deleteResult.deletedCount, "个fireknight用户");
    
    // 2. 创建新的超级管理员（正确加密）
    console.log("🔐 正在创建新的超级管理员...");
    const plainPassword = "letusenjoytheworld";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    console.log("🔍 密码信息:");
    console.log("   - 明文密码:", plainPassword);
    console.log("   - 加密后密码:", hashedPassword);
    
    // 验证加密是否正确
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log("   - 密码验证结果:", isValid);
    
    if (!isValid) {
      throw new Error("密码加密验证失败");
    }
    
    // 插入新用户
    const result = await users.insertOne({
      username: "fireknight",
      email: "fireknight@example.com",
      password: hashedPassword,
      role: "superadmin",
      isActive: true,
      status: "approved",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log("✅ 超级管理员创建成功！");
    console.log("📝 用户ID:", result.insertedId);
    
    // 3. 验证创建结果
    const createdUser = await users.findOne({ _id: result.insertedId });
    if (createdUser) {
      console.log("✅ 数据库验证成功");
      console.log("🔍 用户详细信息:");
      console.log("   - 用户名:", createdUser.username);
      console.log("   - 角色:", createdUser.role);
      console.log("   - 状态:", createdUser.status);
      console.log("   - 是否激活:", createdUser.isActive);
      console.log("   - 密码长度:", createdUser.password.length);
      console.log("   - 密码前缀:", createdUser.password.substring(0, 20) + "...");
    } else {
      throw new Error("用户创建后验证失败");
    }
    
    // 4. 显示数据库中所有用户
    console.log("\n🔍 数据库中所有用户:");
    const allUsers = await users.find({}).toArray();
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.role}) - 密码长度: ${user.password.length}`);
    });
    
  } catch (error) {
    console.error("❌ 操作失败:", error.message);
    console.error("详细错误信息:", error);
  } finally {
    await client.close();
    console.log("\n🔍 MongoDB连接已关闭");
  }
}

cleanAndCreate();