const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./src/config/db');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/health', (_req, res) => {
	res.status(200).json({ status: 'ok' });
});

const startServer = async () => {
	await connectDB();

	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
};

startServer().catch((error) => {
	console.error('Failed to start server:', error.message);
	process.exit(1);
});
