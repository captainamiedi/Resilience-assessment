const { parseReqline } = require('../reqlineParser');

describe('Reqline Parser', () => {
	describe('Valid Parsing', () => {
		test('should parse basic GET request with query', () => {
			const reqline = 'HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {"refid": 1920933}';
			const result = parseReqline(reqline);
			
			expect(result).toEqual({
				method: 'GET',
				url: 'https://dummyjson.com/quotes/3',
				headers: {},
				query: { refid: 1920933 },
				body: {}
			});
		});

		test('should parse GET request with headers and query', () => {
			const reqline = 'HTTP GET | URL https://dummyjson.com/quotes/3 | HEADERS {"Content-Type": "application/json"} | QUERY {"refid": 1920933}';
			const result = parseReqline(reqline);
			
			expect(result).toEqual({
				method: 'GET',
				url: 'https://dummyjson.com/quotes/3',
				headers: { "Content-Type": "application/json" },
				query: { refid: 1920933 },
				body: {}
			});
		});

		test('should parse POST request with body', () => {
			const reqline = 'HTTP POST | URL https://httpbin.org/post | BODY {"name": "test", "value": 123}';
			const result = parseReqline(reqline);
			
			expect(result).toEqual({
				method: 'POST',
				url: 'https://httpbin.org/post',
				headers: {},
				query: {},
				body: { name: "test", value: 123 }
			});
		});

		test('should parse request with all optional sections', () => {
			const reqline = 'HTTP POST | URL https://httpbin.org/post | HEADERS {"Authorization": "Bearer token"} | QUERY {"test": true} | BODY {"data": "value"}';
			const result = parseReqline(reqline);
			
			expect(result).toEqual({
				method: 'POST',
				url: 'https://httpbin.org/post',
				headers: { Authorization: "Bearer token" },
				query: { test: true },
				body: { data: "value" }
			});
		});

		test('should parse request with different keyword order', () => {
			const reqline = 'HTTP GET | URL https://example.com | BODY {"test": 1} | HEADERS {"Accept": "json"} | QUERY {"q": "search"}';
			const result = parseReqline(reqline);
			
			expect(result).toEqual({
				method: 'GET',
				url: 'https://example.com',
				headers: { Accept: "json" },
				query: { q: "search" },
				body: { test: 1 }
			});
		});

		test('should parse minimal valid request', () => {
			const reqline = 'HTTP GET | URL https://example.com';
			const result = parseReqline(reqline);
			
			expect(result).toEqual({
				method: 'GET',
				url: 'https://example.com',
				headers: {},
				query: {},
				body: {}
			});
		});
	});

	describe('Required Keywords Validation', () => {
		test('should throw error for missing HTTP keyword', () => {
			const reqline = 'URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('HTTP keyword must be first');
		});

		test('should throw error for missing URL keyword', () => {
			const reqline = 'HTTP GET';
			expect(() => parseReqline(reqline)).toThrow('Missing required HTTP and URL sections');
		});

		test('should throw error when URL is not second', () => {
			const reqline = 'HTTP GET | HEADERS {"test": "value"} | URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('Missing required URL keyword');
		});
	});

	describe('HTTP Method Validation', () => {
		test('should throw error for invalid HTTP method', () => {
			const reqline = 'HTTP PUT | URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('Invalid HTTP method. Only GET and POST are supported');
		});

		test('should throw error for lowercase HTTP method', () => {
			const reqline = 'HTTP get | URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('HTTP method must be uppercase');
		});

		test('should throw error for mixed case HTTP method', () => {
			const reqline = 'HTTP Get | URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('HTTP method must be uppercase');
		});
	});

	describe('Keyword Case Validation', () => {
		test('should throw error for lowercase http keyword', () => {
			const reqline = 'http GET | URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('Keywords must be uppercase');
		});

		test('should throw error for lowercase url keyword', () => {
			const reqline = 'HTTP GET | url https://example.com';
			expect(() => parseReqline(reqline)).toThrow('Keywords must be uppercase');
		});

		test('should throw error for lowercase headers keyword', () => {
			const reqline = 'HTTP GET | URL https://example.com | headers {"test": "value"}';
			expect(() => parseReqline(reqline)).toThrow('Keywords must be uppercase');
		});

		test('should throw error for lowercase query keyword', () => {
			const reqline = 'HTTP GET | URL https://example.com | query {"test": "value"}';
			expect(() => parseReqline(reqline)).toThrow('Keywords must be uppercase');
		});

		test('should throw error for lowercase body keyword', () => {
			const reqline = 'HTTP GET | URL https://example.com | body {"test": "value"}';
			expect(() => parseReqline(reqline)).toThrow('Keywords must be uppercase');
		});
	});

	describe('Spacing Validation', () => {
		test('should throw error for missing space before pipe', () => {
			const reqline = 'HTTP GET| URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('Invalid spacing around pipe delimiter');
		});

		test('should throw error for missing space after pipe', () => {
			const reqline = 'HTTP GET |URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('Invalid spacing around pipe delimiter');
		});

		test('should throw error for missing space after keyword', () => {
			const reqline = 'HTTP GET | URLhttps://example.com';
			expect(() => parseReqline(reqline)).toThrow('Missing space after keyword');
		});

		test('should throw error for multiple spaces after keyword', () => {
			const reqline = 'HTTP GET | URL  https://example.com';
			expect(() => parseReqline(reqline)).toThrow('Multiple spaces found where single space expected');
		});

		test('should throw error for multiple spaces before pipe', () => {
			const reqline = 'HTTP GET  | URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('Invalid spacing around pipe delimiter');
		});

		test('should throw error for multiple spaces after pipe', () => {
			const reqline = 'HTTP GET |  URL https://example.com';
			expect(() => parseReqline(reqline)).toThrow('Invalid spacing around pipe delimiter');
		});
	});

	describe('JSON Validation', () => {
		test('should throw error for invalid JSON in HEADERS', () => {
			const reqline = 'HTTP GET | URL https://example.com | HEADERS {invalid json}';
			expect(() => parseReqline(reqline)).toThrow('Invalid JSON format in HEADERS section');
		});

		test('should throw error for invalid JSON in QUERY', () => {
			const reqline = 'HTTP GET | URL https://example.com | QUERY {invalid: json}';
			expect(() => parseReqline(reqline)).toThrow('Invalid JSON format in QUERY section');
		});

		test('should throw error for invalid JSON in BODY', () => {
			const reqline = 'HTTP POST | URL https://example.com | BODY {invalid json}';
			expect(() => parseReqline(reqline)).toThrow('Invalid JSON format in BODY section');
		});

		test('should throw error for array in HEADERS', () => {
			const reqline = 'HTTP GET | URL https://example.com | HEADERS ["invalid"]';
			expect(() => parseReqline(reqline)).toThrow('Invalid JSON format in HEADERS section');
		});

		test('should throw error for null in QUERY', () => {
			const reqline = 'HTTP GET | URL https://example.com | QUERY null';
			expect(() => parseReqline(reqline)).toThrow('Invalid JSON format in QUERY section');
		});

		test('should throw error for string in BODY', () => {
			const reqline = 'HTTP POST | URL https://example.com | BODY "invalid"';
			expect(() => parseReqline(reqline)).toThrow('Invalid JSON format in BODY section');
		});
	});

	describe('URL Validation', () => {
		test('should throw error for empty URL', () => {
			const reqline = 'HTTP GET | URL ';
			expect(() => parseReqline(reqline)).toThrow('Missing space after keyword');
		});

		test('should throw error for URL without protocol', () => {
			const reqline = 'HTTP GET | URL example.com';
			expect(() => parseReqline(reqline)).toThrow('URL must start with http:// or https://');
		});

		test('should accept http:// URLs', () => {
			const reqline = 'HTTP GET | URL http://example.com';
			const result = parseReqline(reqline);
			expect(result.url).toBe('http://example.com');
		});

		test('should accept https:// URLs', () => {
			const reqline = 'HTTP GET | URL https://example.com';
			const result = parseReqline(reqline);
			expect(result.url).toBe('https://example.com');
		});
	});

	describe('Duplicate Keywords', () => {
		test('should throw error for duplicate HTTP keyword', () => {
			const reqline = 'HTTP GET | URL https://example.com | HTTP POST';
			expect(() => parseReqline(reqline)).toThrow('Duplicate keyword: HTTP');
		});

		test('should throw error for duplicate URL keyword', () => {
			const reqline = 'HTTP GET | URL https://example.com | URL https://other.com';
			expect(() => parseReqline(reqline)).toThrow('Duplicate keyword: URL');
		});

		test('should throw error for duplicate HEADERS keyword', () => {
			const reqline = 'HTTP GET | URL https://example.com | HEADERS {"a": 1} | HEADERS {"b": 2}';
			expect(() => parseReqline(reqline)).toThrow('Duplicate keyword: HEADERS');
		});
	});

	describe('Edge Cases', () => {
		test('should throw error for empty reqline', () => {
			expect(() => parseReqline('')).toThrow('Reqline statement cannot be empty');
		});

		test('should throw error for null reqline', () => {
			expect(() => parseReqline(null)).toThrow('Reqline statement cannot be empty');
		});

		test('should throw error for undefined reqline', () => {
			expect(() => parseReqline(undefined)).toThrow('Reqline statement cannot be empty');
		});

		test('should throw error for non-string reqline', () => {
			expect(() => parseReqline(123)).toThrow('Reqline statement cannot be empty');
		});

		test('should throw error for whitespace-only reqline', () => {
			expect(() => parseReqline('   ')).toThrow('Reqline statement cannot be empty');
		});

		test('should throw error for invalid keyword', () => {
			const reqline = 'HTTP GET | URL https://example.com | INVALID {"test": "value"}';
			expect(() => parseReqline(reqline)).toThrow('Invalid keyword: INVALID');
		});

		test('should handle complex JSON values', () => {
			const reqline = 'HTTP POST | URL https://example.com | BODY {"nested": {"deep": {"value": [1, 2, 3]}}, "boolean": true, "null": null}';
			const result = parseReqline(reqline);
			expect(result.body).toEqual({
				nested: { deep: { value: [1, 2, 3] } },
				boolean: true,
				null: null
			});
		});
	});
});