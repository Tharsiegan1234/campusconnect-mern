const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;
        if (uri) {
            uri = uri.trim().replace(/^["']|["']$/g, '');
            const maskedUri = uri.replace(/(:\/\/)([^:]+):([^@]+)(@)/, '$1$2:****$4');
            console.log(`Attempting to connect with URI: ${maskedUri}`);
        }
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // process.exit(1);
    }
};

module.exports = connectDB;
