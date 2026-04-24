const mongoose = require('mongoose');
require('dotenv').config();

const baseUri = "mongodb://ravindu:aH8D7GtE3yH1aIfx@ac-khze6ml-shard-00-00.tlknk3x.mongodb.net:27017,ac-khze6ml-shard-00-01.tlknk3x.mongodb.net:27017,ac-khze6ml-shard-00-02.tlknk3x.mongodb.net:27017/campusconnect?ssl=true&authSource=admin";

const tests = [
    { name: "Original with replicaSet", uri: baseUri + "&replicaSet=atlas-1qfwzz-shard-0" },
    { name: "Without replicaSet", uri: baseUri },
    { name: "Standard mongodb+srv", uri: "mongodb+srv://ravindu:aH8D7GtE3yH1aIfx@ac-khze6ml.tlknk3x.mongodb.net/campusconnect?retryWrites=true&w=majority" }
];

const runTests = async () => {
    for (const test of tests) {
        console.log(`\n--- Testing: ${test.name} ---`);
        try {
            console.log(`Connecting...`);
            const conn = await Promise.race([
                mongoose.connect(test.uri, { serverSelectionTimeoutMS: 5000 }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout after 5s")), 5500))
            ]);
            console.log(`SUCCESS: Connected to ${conn.connection.host}`);
            await mongoose.disconnect();
            console.log("Disconnected.");
        } catch (error) {
            console.error(`FAILURE: ${error.message}`);
        }
    }
    process.exit(0);
};

runTests();
