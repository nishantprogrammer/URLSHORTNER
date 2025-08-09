import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import dbconnect from './utils/db.js'
import urlRoutes from './Routes/urlRoutes.js'
dotenv.config({})
const Port = process.env.PORT || 8000
const app = express()
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsoption = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}
// Trust proxy headers when deployed behind a proxy (adjust as needed)
app.set('trust proxy', true)
app.use(cors(corsoption))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use("/",urlRoutes)
app.listen(Port,()=>{dbconnect();console.log(`Server is Running on Port ${Port}`)})