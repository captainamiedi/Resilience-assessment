const VALID_METHODS = ['GET', 'POST'];
const REQUIRED_KEYWORDS = ['HTTP', 'URL'];
const OPTIONAL_KEYWORDS = ['HEADERS', 'QUERY', 'BODY'];
const ALL_KEYWORDS = [...REQUIRED_KEYWORDS, ...OPTIONAL_KEYWORDS];

/**
 * Parse a reqline statement into structured data
 * @param {string} reqline - The reqline statement to parse
 * @returns {Object} Parsed request object
 */
function parseReqline(reqline) {
	if (typeof reqline !== 'string' || !reqline.trim()) {
		throw new Error('Reqline statement cannot be empty');
	}

	// Split by pipe delimiter
	const segments = splitByPipe(reqline);
	
	// Validate and parse each segment
	const parsedSegments = {};
	
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i];
		const { keyword, value } = parseSegment(segment, i);
		
		if (parsedSegments[keyword]) {
			throw new Error(`Duplicate keyword: ${keyword}`);
		}
		
		parsedSegments[keyword] = value;
	}
	
	// Validate keyword order (HTTP and URL must be first two)
	validateKeywordOrder(segments);
	
	// Validate required keywords are present
	validateRequiredKeywords(parsedSegments);
	
	// Parse and validate each section
	const result = {
		method: parsedSegments.HTTP,
		url: parsedSegments.URL,
		headers: {},
		query: {},
		body: {}
	};
	
	// Parse optional JSON sections
	if (parsedSegments.HEADERS) {
		result.headers = parseJsonSection(parsedSegments.HEADERS, 'HEADERS');
	}
	
	if (parsedSegments.QUERY) {
		result.query = parseJsonSection(parsedSegments.QUERY, 'QUERY');
	}
	
	if (parsedSegments.BODY) {
		result.body = parseJsonSection(parsedSegments.BODY, 'BODY');
	}
	
	return result;
}

/**
 * Split reqline by pipe delimiter with validation
 * @param {string} reqline - The reqline statement
 * @returns {Array} Array of segments
 */
function splitByPipe(reqline) {
	const segments = [];
	let current = '';
	let i = 0;
	
	while (i < reqline.length) {
		if (reqline[i] === '|') {
			// Check for proper spacing around pipe
			if (i === 0 || reqline[i - 1] !== ' ') {
				throw new Error('Invalid spacing around pipe delimiter');
			}
			if (i === reqline.length - 1 || reqline[i + 1] !== ' ') {
				throw new Error('Invalid spacing around pipe delimiter');
			}
			
			segments.push(current.trim());
			current = '';
			i += 2; // Skip pipe and space
		} else {
			current += reqline[i];
			i++;
		}
	}
	
	if (current.trim()) {
		segments.push(current.trim());
	}
	
	if (segments.length < 2) {
		throw new Error('Missing required HTTP and URL sections');
	}
	
	return segments;
}

/**
 * Parse a single segment into keyword and value
 * @param {string} segment - The segment to parse
 * @param {number} index - The segment index for validation
 * @returns {Object} Object with keyword and value
 */
function parseSegment(segment, index) {
	const trimmed = segment.trim();
	
	if (!trimmed) {
		throw new Error('Empty segment found');
	}
	
	// Find the first space to separate keyword from value
	let spaceIndex = -1;
	for (let i = 0; i < trimmed.length; i++) {
		if (trimmed[i] === ' ') {
			spaceIndex = i;
			break;
		}
	}
	
	if (spaceIndex === -1) {
		throw new Error('Missing space after keyword');
	}
	
	const keyword = trimmed.substring(0, spaceIndex);
	const value = trimmed.substring(spaceIndex + 1);
	
	// Validate keyword
	if (!ALL_KEYWORDS.includes(keyword)) {
		if (keyword.toLowerCase() === 'http' || keyword.toLowerCase() === 'url' || 
			keyword.toLowerCase() === 'headers' || keyword.toLowerCase() === 'query' || 
			keyword.toLowerCase() === 'body') {
			throw new Error('Keywords must be uppercase');
		}
		throw new Error(`Invalid keyword: ${keyword}`);
	}
	
	// Check for multiple spaces after keyword
	if (value.startsWith(' ')) {
		throw new Error('Multiple spaces found where single space expected');
	}
	
	// Validate specific keyword values
	if (keyword === 'HTTP') {
		if (!VALID_METHODS.includes(value)) {
			if (value.toUpperCase() === 'GET' || value.toUpperCase() === 'POST') {
				throw new Error('HTTP method must be uppercase');
			}
			throw new Error('Invalid HTTP method. Only GET and POST are supported');
		}
	}
	
	if (keyword === 'URL') {
		if (!value.trim()) {
			throw new Error('URL cannot be empty');
		}
		// Basic URL validation
		if (!value.startsWith('http://') && !value.startsWith('https://')) {
			throw new Error('URL must start with http:// or https://');
		}
	}
	
	return { keyword, value: value.trim() };
}

/**
 * Validate that required keywords are present
 * @param {Object} parsedSegments - The parsed segments object
 */
function validateRequiredKeywords(parsedSegments) {
	for (const keyword of REQUIRED_KEYWORDS) {
		if (!parsedSegments[keyword]) {
			throw new Error(`Missing required ${keyword} keyword`);
		}
	}
}

/**
 * Validate keyword order (HTTP and URL must be first two)
 * @param {Array} segments - Array of segments
 */
function validateKeywordOrder(segments) {
	if (segments.length < 2) {
		throw new Error('Missing required HTTP and URL sections');
	}
	
	const firstKeyword = segments[0].split(' ')[0];
	const secondKeyword = segments[1].split(' ')[0];
	
	if (firstKeyword !== 'HTTP') {
		throw new Error('HTTP keyword must be first');
	}
	
	if (secondKeyword !== 'URL') {
		// Check if it's a missing URL case vs wrong order
		if (!ALL_KEYWORDS.includes(secondKeyword)) {
			throw new Error('URL keyword must be second');
		}
		// If it's a valid keyword but not URL, it means URL is missing
		throw new Error('Missing required URL keyword');
	}
}

/**
 * Parse JSON section with proper error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {string} sectionName - The section name for error messages
 * @returns {Object} Parsed JSON object
 */
function parseJsonSection(jsonString, sectionName) {
	try {
		const parsed = JSON.parse(jsonString);
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
			throw new Error(`Invalid JSON format in ${sectionName} section`);
		}
		return parsed;
	} catch (error) {
		if (error.message.includes('JSON format')) {
			throw error;
		}
		throw new Error(`Invalid JSON format in ${sectionName} section`);
	}
}

module.exports = {
	parseReqline
};