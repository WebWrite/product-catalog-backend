import "dotenv/config"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

import User from "../models/User.js"
import SellerProfile from "../models/seller.profile.model.js"
import Product from "../models/Product.js"
import Cart from "../models/Cart.js"

const PASSWORD = "Rfvg@1946"

const users = [
  { name: "Ali Seller", email: "ali.seller@test.com", role: "seller" },
  { name: "Sara Seller", email: "sara.seller@test.com", role: "seller" },
  { name: "Usman Seller", email: "usman.seller@test.com", role: "seller" },

  {
    name: "Ahmed Customer",
    email: "ahmed.customer@test.com",
    role: "customer"
  },
  { name: "Ayesha Customer", email: "ali.customer@test.com", role: "customer" },
  { name: "Hamza Customer", email: "hamza.customer@test.com", role: "customer" }
]

const sellerProfiles = [
  {
    email: "ali.seller@test.com",
    storeName: "Ali Clothing Store",
    storeType: "Clothing"
  },
  {
    email: "ahmad.seller@test.com",
    storeName: "Sara Electronics",
    storeType: "Electronics"
  },
  {
    email: "usman.seller@test.com",
    storeName: "Usman Sports Store",
    storeType: "Sports"
  }
]

const products = [
  {
    sellerEmail: "ali.seller@test.com",
    category: "Clothing",
    name: "Classic T-Shirt",
    description: "Comfortable cotton T-shirt for everyday use.",
    price: 1500,
    sizes: ["S", "M", "L", "XL"],
    stock: 50
  },
  {
    sellerEmail: "ali.seller@test.com",
    category: "Clothing",
    name: "Casual Hoodie",
    description: "Soft casual hoodie for daily wear.",
    price: 2800,
    sizes: ["M", "L", "XL"],
    stock: 30
  },
  {
    sellerEmail: "ali.seller@test.com",
    category: "Clothing",
    name: "Cotton Cap",
    description: "Lightweight cotton cap.",
    price: 600,
    sizes: [],
    stock: 40
  },
  {
    sellerEmail: "sara.seller@test.com",
    category: "Electronics",
    name: "Wireless Mouse",
    description: "Wireless mouse for office and home use.",
    price: 1800,
    sizes: [],
    stock: 25
  },
  {
    sellerEmail: "sara.seller@test.com",
    category: "Electronics",
    name: "USB Keyboard",
    description: "USB keyboard for desktop computers.",
    price: 2200,
    sizes: [],
    stock: 20
  },
  {
    sellerEmail: "sara.seller@test.com",
    category: "Electronics",
    name: "USB-C Cable",
    description: "Durable USB-C charging cable.",
    price: 500,
    sizes: [],
    stock: 100
  },
  {
    sellerEmail: "usman.seller@test.com",
    category: "Sports",
    name: "Football",
    description: "Football suitable for casual outdoor games.",
    price: 2500,
    sizes: [],
    stock: 15
  },
  {
    sellerEmail: "usman.seller@test.com",
    category: "Sports",
    name: "Gym Gloves",
    description: "Comfortable gloves for weight training.",
    price: 1200,
    sizes: [],
    stock: 35
  },
  {
    sellerEmail: "usman.seller@test.com",
    category: "Sports",
    name: "Skipping Rope",
    description: "Adjustable skipping rope for workouts.",
    price: 700,
    sizes: [],
    stock: 45
  }
]

const cartDefinitions = [
  {
    customerEmail: "ahmed.customer@test.com",
    items: [
      { productName: "Classic T-Shirt", quantity: 2, size: "L" },
      { productName: "Wireless Mouse", quantity: 1, size: null },
      { productName: "Football", quantity: 1, size: null }
    ]
  },
  {
    customerEmail: "ayesha.customer@test.com",
    items: [
      { productName: "Casual Hoodie", quantity: 1, size: "M" },
      { productName: "USB Keyboard", quantity: 2, size: null },
      { productName: "Gym Gloves", quantity: 1, size: null }
    ]
  },
  {
    customerEmail: "hamza.customer@test.com",
    items: [
      { productName: "Cotton Cap", quantity: 2, size: null },
      { productName: "USB-C Cable", quantity: 3, size: null },
      { productName: "Skipping Rope", quantity: 1, size: null }
    ]
  }
]

const imageUrl = "https://placehold.co/600x600/png?text=Test+Product"

async function seedTestData() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from your .env file.")
  }

  await mongoose.connect("process.env.DATABASE_URL")
  console.log("Database connected.")

  // 1. Create users. Hash the shared password once.
  const hashedPassword = await bcrypt.hash(PASSWORD, 12)
  const userIds = new Map()

  for (const user of users) {
    const savedUser = await User.findOneAndUpdate(
      { email: user.email },
      {
        $set: {
          name: user.name,
          password: hashedPassword,
          role: user.role,
          isVerified: true,
          status: "active"
        },
        $setOnInsert: { email: user.email }
      },
      { upsert: true, new: true, runValidators: true }
    )

    userIds.set(user.email, savedUser._id)
  }

  console.log("Users seeded.")

  // 2. Create seller profiles using the seller user IDs.
  for (const profile of sellerProfiles) {
    await SellerProfile.findOneAndUpdate(
      { userId: userIds.get(profile.email) },
      {
        $set: {
          storeName: profile.storeName,
          storeType: profile.storeType
        }
      },
      { upsert: true, new: true, runValidators: true }
    )
  }

  console.log("Seller profiles seeded.")

  // 3. Create products using their actual seller IDs.
  const productIds = new Map()

  for (const product of products) {
    const sellerId = userIds.get(product.sellerEmail)

    const savedProduct = await Product.findOneAndUpdate(
      { sellerId, name: product.name },
      {
        $set: {
          category: product.category,
          description: product.description,
          image: {
            url: imageUrl,
            publicId: `seed-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
          },
          price: product.price,
          sizes: product.sizes,
          stock: product.stock,
          status: "active"
        },
        $setOnInsert: { sellerId, name: product.name }
      },
      { upsert: true, new: true, runValidators: true }
    )

    productIds.set(product.name, savedProduct._id)
  }

  console.log("Products seeded.")

  // 4. Create carts using the real customer and product IDs.
  for (const cart of cartDefinitions) {
    const items = cart.items.map((item) => {
      const productId = productIds.get(item.productName)

      if (!productId) {
        throw new Error(`Missing seeded product: ${item.productName}`)
      }

      return {
        productId,
        quantity: item.quantity,
        size: item.size
      }
    })

    await Cart.findOneAndUpdate(
      { userId: userIds.get(cart.customerEmail) },
      { $set: { items } },
      { upsert: true, new: true, runValidators: true }
    )
  }

  console.log("Carts seeded.")

  console.log("\nTest login credentials:")
  for (const user of users) {
    console.log(`${user.role}: ${user.email} | ${PASSWORD}`)
  }

  console.log("\nSeed completed successfully.")
}

seedTestData()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
