import UrlModel from "../Models/Url.js";
import AdminModel from "../Models/Admin.js";
import { nanoid } from "nanoid";

const RESERVED_WORDS = new Set([
    'admin', 'api', 'www', 'root', 'system', 'login', 'logout', 'signup', 'register',
    'help', 'support', 'status', 'static', 'assets', 'public', 'private', 'dashboard',
    'settings', 'user', 'users', 'auth', 'oauth', 'security', 'shorten', 'analytics', 'availability', 'favicon.ico'
]);

const isValidCustomSlug = (slug) => {
    if (typeof slug !== 'string') return false;
    const trimmed = slug.trim();
    if (trimmed.length < 3 || trimmed.length > 20) return false;
    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return false;
    if (RESERVED_WORDS.has(trimmed.toLowerCase())) return false;
    return true;
};

const buildQrUrl = (fullShortUrl) => {
    const encoded = encodeURIComponent(fullShortUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;
};

// Create short URL
export const createShortUrl = async (req, res) => {
    try {
        let { originalUrl, customSlug } = req.body;

        if (!originalUrl || !originalUrl.trim()) {
            return res.status(400).json({ message: "Original URL is required" });
        }

        // Trim whitespace
        originalUrl = originalUrl.trim();

        // Add protocol if missing
        if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
            originalUrl = 'https://' + originalUrl;
        }

        // Validate URL format
        try {
            const urlObj = new URL(originalUrl);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return res.status(400).json({ message: "Only HTTP/HTTPS URLs are allowed" });
            }
        } catch (error) {
            return res.status(400).json({ message: "Invalid URL format" });
        }

        let shortUrl;

        // If a custom slug is provided and valid, use it
        if (customSlug && customSlug.trim()) {
            if (!isValidCustomSlug(customSlug)) {
                return res.status(400).json({ message: "Invalid custom URL. Use 3-20 chars, letters/numbers/hyphen/underscore, and avoid reserved words." });
            }
            shortUrl = customSlug.trim();
            const collision = await UrlModel.findOne({ shortUrl });
            if (collision) {
                return res.status(409).json({ message: "Custom URL already taken" });
            }
        } else {
            // Check if URL already exists (optional) only for random
            const existingUrl = await UrlModel.findOne({ originalUrl });
            if (existingUrl) {
                const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
                const fullShort = `${base}/${existingUrl.shortUrl}`;
                return res.status(200).json({
                    message: "Short URL already exists",
                    data: existingUrl,
                    fullShortUrl: fullShort,
                    qrCodeUrl: buildQrUrl(fullShort)
                });
            }

            // Generate a unique short URL id
            shortUrl = nanoid(6);
            // Ensure uniqueness (rare but possible collision)
            while (await UrlModel.findOne({ shortUrl })) {
                shortUrl = nanoid(6);
            }
        }

        const newUrl = await UrlModel.create({
            originalUrl,
            shortUrl
        });

        const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
        const fullShort = `${base}/${newUrl.shortUrl}`;

        return res.status(201).json({
            message: "Short URL created successfully",
            data: newUrl,
            fullShortUrl: fullShort,
            qrCodeUrl: buildQrUrl(fullShort)
        });

    } catch (error) {
        console.error("Error creating short URL:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Redirect & track IP
export const redirectUrl = async (req, res) => {
    try {
        const { shortId } = req.params;
        const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Look up short code
        const urlDoc = await UrlModel.findOne({ shortUrl: shortId });

        if (!urlDoc) {
            return res.status(404).json({ message: "Short URL not found" });
        }

        // Increment IP count in history
        await urlDoc.incrementIpCount(clientIp);

        // Redirect to original URL
        return res.redirect(urlDoc.originalUrl);

    } catch (error) {
        console.error("Error redirecting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get URL analytics (history) for specific URL
export const getUrlAnalytics = async (req, res) => {
    try {
        const { shortId } = req.params;
        
        const urlDoc = await UrlModel.findOne({ shortUrl: shortId });

        if (!urlDoc) {
            return res.status(404).json({ message: "Short URL not found" });
        }

        // Calculate analytics
        const totalClicks = urlDoc.history.reduce((sum, entry) => sum + entry.count, 0);
        const uniqueVisitors = urlDoc.history.length;

        const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
        const fullShort = `${base}/${urlDoc.shortUrl}`;

        return res.status(200).json({
            originalUrl: urlDoc.originalUrl,
            shortUrl: urlDoc.shortUrl,
            createdAt: urlDoc.createdAt,
            fullShortUrl: fullShort,
            qrCodeUrl: buildQrUrl(fullShort),
            analytics: {
                totalClicks,
                uniqueVisitors,
                recentClicks: urlDoc.history.slice(-5) // Last 5 unique IPs
            },
            history: urlDoc.history
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// NEW: Get all URLs for admin dashboard
export const getAllUrlStats = async (req, res) => {
    try {
        const urls = await UrlModel.find({})
            .sort({ createdAt: -1 }) // Most recent first
            .limit(100); // Limit to last 100 URLs

        // Calculate stats for each URL
        const urlsWithStats = urls.map(url => {
            const totalClicks = url.history.reduce((sum, entry) => sum + entry.count, 0);
            const uniqueVisitors = url.history.length;

            const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
            const fullShort = `${base}/${url.shortUrl}`;
            
            return {
                _id: url._id,
                originalUrl: url.originalUrl,
                shortUrl: url.shortUrl,
                createdAt: url.createdAt,
                totalClicks,
                uniqueVisitors,
                history: url.history,
                fullShortUrl: fullShort,
                qrCodeUrl: buildQrUrl(fullShort)
            };
        });

        // Overall statistics
        const totalUrls = urls.length;
        const totalClicks = urlsWithStats.reduce((sum, url) => sum + url.totalClicks, 0);
        const totalUniqueVisitors = urlsWithStats.reduce((sum, url) => sum + url.uniqueVisitors, 0);

        return res.status(200).json({
            message: "Stats retrieved successfully",
            summary: {
                totalUrls,
                totalClicks,
                totalUniqueVisitors
            },
            urls: urlsWithStats
        });

    } catch (error) {
        console.error("Error fetching all URL stats:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// NEW: Check availability of a custom slug
export const checkSlugAvailability = async (req, res) => {
    try {
        const { slug } = req.query;
        if (!slug || !slug.trim()) {
            return res.status(400).json({ status: 'invalid', message: 'Slug is required' });
        }
        if (!isValidCustomSlug(slug)) {
            return res.status(200).json({ status: 'invalid', message: 'Invalid format or reserved word' });
        }
        const exists = await UrlModel.findOne({ shortUrl: slug.trim() });
        if (exists) {
            return res.status(200).json({ status: 'taken', message: 'Already taken' });
        }
        return res.status(200).json({ status: 'available', message: 'Available' });
    } catch (error) {
        console.error('Error checking slug availability:', error);
        return res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// NEW: Verify admin password
export const verifyAdminPassword = async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password || !password.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "Password is required" 
            });
        }

        // Get admin password from database
        const adminDoc = await AdminModel.findOne({});
        
        if (!adminDoc) {
            // If no admin exists, create one with default password
            const defaultPassword = "admin123"; // You can change this default
            await AdminModel.create({ password: defaultPassword });
            
            if (password === defaultPassword) {
                return res.status(200).json({ 
                    success: true, 
                    message: "Admin access granted",
                    isDefaultPassword: true
                });
            } else {
                return res.status(401).json({ 
                    success: false, 
                    message: "Incorrect password" 
                });
            }
        }

        // Check if password matches
        if (password === adminDoc.password) {
            return res.status(200).json({ 
                success: true, 
                message: "Admin access granted",
                isDefaultPassword: false
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                message: "Incorrect password" 
            });
        }

    } catch (error) {
        console.error("Error verifying admin password:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};

// NEW: Update admin password (requires current password verification)
export const updateAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "Both current and new passwords are required" 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: "New password must be at least 6 characters long" 
            });
        }

        // Get admin document
        const adminDoc = await AdminModel.findOne({});
        
        if (!adminDoc) {
            return res.status(404).json({ 
                success: false, 
                message: "Admin account not found" 
            });
        }

        // Verify current password
        if (currentPassword !== adminDoc.password) {
            return res.status(401).json({ 
                success: false, 
                message: "Current password is incorrect" 
            });
        }

        // Update password
        adminDoc.password = newPassword;
        await adminDoc.save();

        return res.status(200).json({ 
            success: true, 
            message: "Password updated successfully" 
        });

    } catch (error) {
        console.error("Error updating admin password:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};

