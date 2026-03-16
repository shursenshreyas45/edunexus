import express from 'express';
import { register, login } from './controllers/authController';
import { getProfile, upsertProfile, searchProfiles } from './controllers/profileController';
import { getListingById, getListingsFeed, createListing } from './controllers/listingController';
import { createPost, getPostsFeed, createComment, getPostById } from './controllers/postController';
import { requireAuth } from './middleware/requireAuth';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Auth Routes
app.post('/register', register);
app.post('/login', login);

// Profile Routes
app.get('/profiles/search', requireAuth, searchProfiles);
app.get('/profile/me', requireAuth, getProfile);
app.put('/profile/me', requireAuth, upsertProfile);

// Listing Routes
app.post('/listings', requireAuth, createListing);
app.get('/listings', requireAuth, getListingsFeed);
app.get('/listings/:id', requireAuth, getListingById);

// Post Routes
app.post('/posts', requireAuth, createPost);
app.get('/posts', requireAuth, getPostsFeed);
app.get('/posts/:id', requireAuth, getPostById);
app.post('/posts/:id/comments', requireAuth, createComment);

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = env.PORT;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`EduNexus API listening on port ${PORT}`);
    });
}

export default app;
