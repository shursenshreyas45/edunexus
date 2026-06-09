"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("./controllers/authController");
const profileController_1 = require("./controllers/profileController");
const listingController_1 = require("./controllers/listingController");
const postController_1 = require("./controllers/postController");
const requireAuth_1 = require("./middleware/requireAuth");
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Parse JSON bodies — 50mb limit to support Base64 image uploads
app.use(express_1.default.json({ limit: '50mb' }));
// Auth Routes
app.post('/register', authController_1.register);
app.post('/login', authController_1.login);
// Profile Routes
app.get('/profiles/search', requireAuth_1.requireAuth, profileController_1.searchProfiles);
app.get('/profile/me', requireAuth_1.requireAuth, profileController_1.getProfile);
app.put('/profile/me', requireAuth_1.requireAuth, profileController_1.upsertProfile);
// Listing Routes
app.post('/listings', requireAuth_1.requireAuth, listingController_1.createListing);
app.get('/listings', requireAuth_1.requireAuth, listingController_1.getListingsFeed);
app.get('/listings/:id', requireAuth_1.requireAuth, listingController_1.getListingById);
// Post Routes
app.post('/posts', requireAuth_1.requireAuth, postController_1.createPost);
app.get('/posts', requireAuth_1.requireAuth, postController_1.getPostsFeed);
app.get('/posts/:id', requireAuth_1.requireAuth, postController_1.getPostById);
app.post('/posts/:id/comments', requireAuth_1.requireAuth, postController_1.createComment);
// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
const PORT = env_1.env.PORT;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`EduNexus API listening on port ${PORT}`);
    });
}
exports.default = app;
