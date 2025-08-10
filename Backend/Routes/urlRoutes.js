import express from "express";
import { createShortUrl, getUrlAnalytics, redirectUrl, checkSlugAvailability, getAllUrlStats, verifyAdminPassword, updateAdminPassword } from "../Controllers/url.js";

const router = express.Router();

// Availability check for custom slug
router.get("/availability", checkSlugAvailability);

// Create a short URL
router.post("/shorten", createShortUrl);

// Admin password management
router.post("/admin/verify", verifyAdminPassword);
router.put("/admin/password", updateAdminPassword);

// Admin stats (no auth required)
router.get("/admin/stats", getAllUrlStats);

// Get analytics for a short URL (no auth required)
router.get("/analytics/:shortId", getUrlAnalytics);

// Redirect from short URL → original URL (keep last)
router.get("/:shortId", redirectUrl);

export default router;
