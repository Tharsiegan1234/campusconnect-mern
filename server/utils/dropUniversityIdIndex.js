const mongoose = require('mongoose');
require('dotenv').config();

const dropUniversityIdIndex = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is not defined in .env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const User = mongoose.connection.collection('users');
        
        // List all indexes to verify it exists
        const indexes = await User.indexes();
        console.log("Existing indexes:", indexes.map(idx => idx.name));

        const indexName = 'universityId_1';
        const indexExists = indexes.some(idx => idx.name === indexName);

        if (indexExists) {
            await User.dropIndex(indexName);
            console.log(`Successfully dropped index: ${indexName}`);
        } else {
            console.log(`Index ${indexName} does not exist. It might have been dropped already or doesn't exist under this name.`);
        }

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error dropping index:", error);
        process.exit(1);
    }
};

dropUniversityIdIndex();
