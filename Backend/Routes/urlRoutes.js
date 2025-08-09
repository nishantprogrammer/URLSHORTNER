import express from "express";
import { createShortUrl, getUrlAnalytics, redirectUrl, checkSlugAvailability, getAllUrlStats } from "../Controllers/url.js";
import adminAuth from "../Middleware/adminAuth.js";

const router = express.Router();

// Availability check for custom slug
router.get("/availability", checkSlugAvailability);

// Create a short URL
router.post("/shorten", createShortUrl);

// Admin stats
router.get("/admin/stats", adminAuth, getAllUrlStats);

// Get analytics for a short URL (keep above the redirect route)
router.get("/analytics/:shortId", adminAuth, getUrlAnalytics);

// Redirect from short URL → original URL (keep last)
router.get("/:shortId", redirectUrl);

export default router;
