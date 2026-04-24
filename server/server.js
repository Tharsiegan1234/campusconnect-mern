const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const createAdmin = require('./config/createAdmin');
const seedGroups = require('./config/seedGroups');

dotenv.config();

// Connect to Database
connectDB().then(() => {
    // Create Default Admin
    createAdmin();
    // Seed Q&A Groups
    seedGroups();
});

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Map to store connected users: userId -> socketId
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Client emits 'register' when they log in
    socket.on('register', (userId) => {
        if (userId) {
            userSockets.set(userId, socket.id);
            console.log(`User ${userId} registered with socket ${socket.id}`);

            // Broadcast the updated list of online users to everyone
            io.emit('online_users', Array.from(userSockets.keys()));
        }
    });

    socket.on('disconnect', () => {
        // Remove user from map on disconnect
        for (let [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                console.log(`User ${userId} disconnected`);

                // Broadcast the updated list of online users to everyone
                io.emit('online_users', Array.from(userSockets.keys()));
                break;
            }
        }
    });
});

// Broadcast online users immediately upon connection to give the new client the current state
io.on('connection', (socket) => {
    socket.emit('online_users', Array.from(userSockets.keys()));
});

// Export io and userSockets for use in controllers
app.set('io', io);
app.set('userSockets', userSockets);

// Middleware
app.use(express.json());
app.use(cors());

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Define Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/qa', require('./routes/QA/qaRoutes'));
app.use('/api/notifications', require('./routes/QA/notificationRoutes')); // Add notification routes
app.use('/api/peer-skills', require('./routes/peer-skill-exchange/skillRoutes')); // Peer Skill Exchange Routes

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
