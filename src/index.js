const express = require('express');
const cors = require('cors');
const { parseReqline } = require('./parser/reqlineParser');
const { executeRequest } = require('./services/requestService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Base endpoint for reqline parsing
app.post('/', async (req, res) => {
	try {
		const { reqline } = req.body;

		if (!reqline) {
			return res.status(400).json({
				error: true,
				message: 'Missing reqline parameter'
			});
		}

		// Parse the reqline statement
		const parsedRequest = parseReqline(reqline);

		// Execute the parsed request
		const response = await executeRequest(parsedRequest);

		res.status(200).json(response);
	} catch (error) {
		res.status(400).json({
			error: true,
			message: error.message
		});
	}
});

// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'OK', service: 'reqline-parser' });
});

app.listen(PORT, () => {
	console.log(`Reqline parser server running on port ${PORT}`);
});