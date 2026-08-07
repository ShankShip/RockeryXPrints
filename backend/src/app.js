import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import { xssClean } from './middleware/xss.middleware.js'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

// Security Headers
app.use(helmet())

// Logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'))

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
})
app.use('/api/', limiter)

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (process.env.NODE_ENV === 'development') return callback(null, true);
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || [];
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))

// Sanitize data against NoSQL Injection and XSS
app.use(mongoSanitize())
app.use(xssClean)

app.use(express.static("public"))
app.use(cookieParser())

import { userRouter } from './routes/user.routes.js'
import { prodRouter } from './routes/product.routes.js'
import { orderRouter } from './routes/order.routes.js'

// Health Check endpoints (Root-level for Render Dashboard & API-level for Frontend)
app.get(['/health', '/api/v1/health'], (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is online", timestamp: new Date().toISOString() });
});

app.use('/api/v1/users', userRouter)
app.use('/api/v1/prods', prodRouter)
app.use('/api/v1/orders', orderRouter)

// Global Error Handler
app.use(errorHandler)

export default app