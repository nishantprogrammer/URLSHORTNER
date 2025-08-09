import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import dbconnect from './utils/db.js'
import urlRoutes from './Routes/urlRoutes.js'
dotenv.config({})
const Port = process.env.PORT || 8000
const app = express()
const corsoption = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}
// Trust proxy headers when deployed behind a proxy (adjust as needed)
app.set('trust proxy', true)
app.use(cors(corsoption))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use("/",urlRoutes)
app.listen(Port,()=>{dbconnect();console.log(`Server is Running on Port ${Port}`)})