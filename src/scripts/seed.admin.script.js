import "dotenv/config"
import { connectDB } from "../config/database.config.js"
import UserRepository from "../repositories/user.rop.js"
import bcrypt from "bcryptjs"

const seedAdmin = async () => {
  try {
    await connectDB()
    let admin = await UserRepository.findUserWithEmail(process.env.ADMIN_EMAIL)
    if (admin) {
      console.log("admin already pressent")
      return
    }
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
    const adminData = {
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      isVerified: true,
      password: hashedPassword,
      role: "admin"
    }
    admin = await UserRepository.createUser(adminData)
    const { name, email, role } = admin
    const a = { name, email, role }
    console.log("admin created", a)
  } catch (err) {
    console.log("error from seed admin file", err)
  }
}
seedAdmin()
