const axios = require('axios');

/**
 * Execute a parsed reqline request and return formatted response
 * @param {Object} parsedRequest - The parsed request object
 * @returns {Object} Formatted response object
 */
async function executeRequest(parsedRequest) {
	const { method, url, headers, query, body } = parsedRequest;
	
	// Build full URL with query parameters
	const fullUrl = buildFullUrl(url, query);
	
	// Prepare axios config
	const axiosConfig = {
		method: method.toLowerCase(),
		url: fullUrl,
		headers: headers,
		timeout: 30000 // 30 second timeout
	};
	
	// Add body for POST requests
	if (method === 'POST' && Object.keys(body).length > 0) {
		axiosConfig.data = body;
		
		// Set default content-type if not provided
		if (!headers['Content-Type'] && !headers['content-type']) {
			axiosConfig.headers = {
				...axiosConfig.headers,
				'Content-Type': 'application/json'
			};
		}
	}
	
	const requestStartTimestamp = Date.now();
	
	try {
		const response = await axios(axiosConfig);
		const requestStopTimestamp = Date.now();
		const duration = requestStopTimestamp - requestStartTimestamp;
		
		return {
			request: {
				query: query,
				body: body,
				headers: headers,
				full_url: fullUrl
			},
			response: {
				http_status: response.status,
				duration: duration,
				request_start_timestamp: requestStartTimestamp,
				request_stop_timestamp: requestStopTimestamp,
				response_data: response.data
			}
		};
	} catch (error) {
		const requestStopTimestamp = Date.now();
		const duration = requestStopTimestamp - requestStartTimestamp;
		
		// Handle axios errors
		if (error.response) {
			// Server responded with error status
			return {
				request: {
					query: query,
					body: body,
					headers: headers,
					full_url: fullUrl
				},
				response: {
					http_status: error.response.status,
					duration: duration,
					request_start_timestamp: requestStartTimestamp,
					request_stop_timestamp: requestStopTimestamp,
					response_data: error.response.data || { error: error.response.statusText }
				}
			};
		} else if (error.request) {
			// Request was made but no response received
			throw new Error(`Network error: Unable to reach ${fullUrl}`);
		} else {
			// Something else happened
			throw new Error(`Request error: ${error.message}`);
		}
	}
}

/**
 * Build full URL with query parameters
 * @param {string} baseUrl - The base URL
 * @param {Object} queryParams - Query parameters object
 * @returns {string} Full URL with query parameters
 */
function buildFullUrl(baseUrl, queryParams) {
	if (!queryParams || Object.keys(queryParams).length === 0) {
		return baseUrl;
	}
	
	const url = new URL(baseUrl);
	
	// Add query parameters
	Object.keys(queryParams).forEach(key => {
		url.searchParams.append(key, queryParams[key]);
	});
	
	return url.toString();
}

module.exports = {
	executeRequest
};