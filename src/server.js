import "dotenv/config";
import express from 'express'
const app = express()
app.use(req , res, next, ()=>{
    console.log('welcome')
    next()
})
app.listen(process.env.PORT , ()=>{
    console.log(`server is running on port ${process.env.PORT}`)
})
