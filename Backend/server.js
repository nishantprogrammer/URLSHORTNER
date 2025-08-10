import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import dbconnect from './utils/db.js'
import urlRoutes from './Routes/urlRoutes.js'

dotenv.config()

const Port = process.env.PORT || 8000
const app = express()

// CORS Configuration - Support multiple origins and production environments
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, '')) // remove trailing slash
  .filter(Boolean)

const corsoption = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    const cleanOrigin = origin.replace(/\/$/, '') // remove trailing slash before comparing
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true)
    }
    
    // In development, allow localhost variations
    if (process.env.NODE_ENV !== 'production' && 
        (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1'))) {
      return callback(null, true)
    }
    
    console.log(`CORS blocked: ${origin} (allowed: ${allowedOrigins.join(', ')})`)
    return callback(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}

// Trust proxy headers when deployed behind a proxy (Render, Heroku, etc.)
app.set('trust proxy', true)

app.use(cors(corsoption))

// Add CORS error handling middleware
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('Not allowed by CORS')) {
    console.error('CORS Error:', err.message)
    console.error('Request Origin:', req.headers.origin)
    console.error('Request Method:', req.method)
    console.error('Request URL:', req.url)
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed',
      origin: req.headers.origin,
      allowedOrigins: allowedOrigins
    })
  }
  next(err)
})

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin
    }
  })
})

// Routes
app.use("/", urlRoutes)

// Start server
app.listen(Port, () => {
  dbconnect()
  console.log(` Server is running on port ${Port}`)
  console.log(` Allowed origins: ${allowedOrigins.join(', ')}`)
})