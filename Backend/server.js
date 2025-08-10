import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import dbconnect from './utils/db.js'
import urlRoutes from './Routes/urlRoutes.js'

dotenv.config()

const Port = process.env.PORT || 8000
const app = express()

//  Support multiple origins (comma-separated) and remove trailing slashes
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')) // remove trailing slash
  .filter(Boolean)

const corsoption = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true) 
    const cleanOrigin = origin.replace(/\/$/, '') // remove trailing slash before comparing
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true)
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true
}

// Trust proxy headers when deployed behind a proxy (Render, Heroku, etc.)
app.set('trust proxy', true)

app.use(cors(corsoption))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Routes
app.use("/", urlRoutes)

// Start server
app.listen(Port, () => {
  dbconnect()
  console.log(` Server is running on port ${Port}`)
  console.log(` Allowed origins: ${allowedOrigins.join(', ')}`)
})
