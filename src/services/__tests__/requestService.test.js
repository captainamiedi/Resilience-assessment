const axios = require('axios');
const { executeRequest } = require('../requestService');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('Request Service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Mock Date.now() for consistent timestamps
		jest.spyOn(Date, 'now')
			.mockReturnValueOnce(1691234567890) // start timestamp
			.mockReturnValueOnce(1691234568237); // stop timestamp
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('Successful Requests', () => {
		test('should execute GET request with query parameters', async () => {
			const mockResponse = {
				status: 200,
				data: {
					id: 3,
					quote: "Thinking is the capital, Enterprise is the way, Hard Work is the solution.",
					author: "Abdul Kalam"
				}
			};

			mockedAxios.mockResolvedValueOnce(mockResponse);

			const parsedRequest = {
				method: 'GET',
				url: 'https://dummyjson.com/quotes/3',
				headers: {},
				query: { refid: 1920933 },
				body: {}
			};

			const result = await executeRequest(parsedRequest);

			expect(mockedAxios).toHaveBeenCalledWith({
				method: 'get',
				url: 'https://dummyjson.com/quotes/3?refid=1920933',
				headers: {},
				timeout: 30000
			});

			expect(result).toEqual({
				request: {
					query: { refid: 1920933 },
					body: {},
					headers: {},
					full_url: 'https://dummyjson.com/quotes/3?refid=1920933'
				},
				response: {
					http_status: 200,
					duration: 347,
					request_start_timestamp: 1691234567890,
					request_stop_timestamp: 1691234568237,
					response_data: mockResponse.data
				}
			});
		});

		test('should execute POST request with body', async () => {
			const mockResponse = {
				status: 201,
				data: { success: true, id: 123 }
			};

			mockedAxios.mockResolvedValueOnce(mockResponse);

			const parsedRequest = {
				method: 'POST',
				url: 'https://httpbin.org/post',
				headers: { 'Authorization': 'Bearer token' },
				query: {},
				body: { name: 'test', value: 123 }
			};

			const result = await executeRequest(parsedRequest);

			expect(mockedAxios).toHaveBeenCalledWith({
				method: 'post',
				url: 'https://httpbin.org/post',
				headers: {
					'Authorization': 'Bearer token',
					'Content-Type': 'application/json'
				},
				timeout: 30000,
				data: { name: 'test', value: 123 }
			});

			expect(result.response.http_status).toBe(201);
			expect(result.response.response_data).toEqual({ success: true, id: 123 });
		});

		test('should not add Content-Type if already provided', async () => {
			const mockResponse = {
				status: 200,
				data: { received: true }
			};

			mockedAxios.mockResolvedValueOnce(mockResponse);

			const parsedRequest = {
				method: 'POST',
				url: 'https://example.com',
				headers: { 'Content-Type': 'application/xml' },
				query: {},
				body: { data: 'test' }
			};

			await executeRequest(parsedRequest);

			expect(mockedAxios).toHaveBeenCalledWith({
				method: 'post',
				url: 'https://example.com',
				headers: { 'Content-Type': 'application/xml' },
				timeout: 30000,
				data: { data: 'test' }
			});
		});

		test('should handle GET request without query parameters', async () => {
			const mockResponse = {
				status: 200,
				data: { message: 'success' }
			};

			mockedAxios.mockResolvedValueOnce(mockResponse);

			const parsedRequest = {
				method: 'GET',
				url: 'https://example.com',
				headers: {},
				query: {},
				body: {}
			};

			const result = await executeRequest(parsedRequest);

			expect(mockedAxios).toHaveBeenCalledWith({
				method: 'get',
				url: 'https://example.com',
				headers: {},
				timeout: 30000
			});

			expect(result.request.full_url).toBe('https://example.com');
		});

		test('should handle POST request without body', async () => {
			const mockResponse = {
				status: 200,
				data: { received: true }
			};

			mockedAxios.mockResolvedValueOnce(mockResponse);

			const parsedRequest = {
				method: 'POST',
				url: 'https://example.com',
				headers: {},
				query: {},
				body: {}
			};

			await executeRequest(parsedRequest);

			expect(mockedAxios).toHaveBeenCalledWith({
				method: 'post',
				url: 'https://example.com',
				headers: {},
				timeout: 30000
			});
		});
	});

	describe('Error Handling', () => {
		test('should handle HTTP error responses', async () => {
			const errorResponse = {
				response: {
					status: 404,
					data: { error: 'Not found' },
					statusText: 'Not Found'
				}
			};

			mockedAxios.mockRejectedValueOnce(errorResponse);

			const parsedRequest = {
				method: 'GET',
				url: 'https://example.com/notfound',
				headers: {},
				query: {},
				body: {}
			};

			const result = await executeRequest(parsedRequest);

			expect(result).toEqual({
				request: {
					query: {},
					body: {},
					headers: {},
					full_url: 'https://example.com/notfound'
				},
				response: {
					http_status: 404,
					duration: 347,
					request_start_timestamp: 1691234567890,
					request_stop_timestamp: 1691234568237,
					response_data: { error: 'Not found' }
				}
			});
		});

		test('should handle HTTP error without response data', async () => {
			const errorResponse = {
				response: {
					status: 500,
					statusText: 'Internal Server Error'
				}
			};

			mockedAxios.mockRejectedValueOnce(errorResponse);

			const parsedRequest = {
				method: 'GET',
				url: 'https://example.com',
				headers: {},
				query: {},
				body: {}
			};

			const result = await executeRequest(parsedRequest);

			expect(result.response.response_data).toEqual({ error: 'Internal Server Error' });
		});

		test('should handle network errors', async () => {
			const networkError = {
				request: {},
				message: 'Network Error'
			};

			mockedAxios.mockRejectedValueOnce(networkError);

			const parsedRequest = {
				method: 'GET',
				url: 'https://unreachable.com',
				headers: {},
				query: {},
				body: {}
			};

			await expect(executeRequest(parsedRequest))
				.rejects.toThrow('Network error: Unable to reach https://unreachable.com');
		});

		test('should handle other request errors', async () => {
			const otherError = {
				message: 'Something went wrong'
			};

			mockedAxios.mockRejectedValueOnce(otherError);

			const parsedRequest = {
				method: 'GET',
				url: 'https://example.com',
				headers: {},
				query: {},
				body: {}
			};

			await expect(executeRequest(parsedRequest))
				.rejects.toThrow('Request error: Something went wrong');
		});
	});

	describe('URL Building', () => {
		test('should build URL with single query parameter', async () => {
			const mockResponse = { status: 200, data: {} };
			mockedAxios.mockResolvedValueOnce(mockResponse);

			const parsedRequest = {
				method: 'GET',
				url: 'https://example.com',
				headers: {},
				query: { test: 'value' },
				body: {}
			};

			await executeRequest(parsedRequest);

			expect(mockedAxios).toHaveBeenCalledWith(
				expect.objectContaining({
					url: 'https://example.com?test=value'
				})
			);
		});

		test('should build URL with multiple query parameters', async () => {
			const mockResponse = { status: 200, data: {} };
			mockedAxios.mockResolvedValueOnce(mockResponse);

			const parsedRequest = {
				method: 'GET',
				url: 'https://example.com',
				headers: {},
				query: { param1: 'value1', param2: 'value2', param3: 123 },
				body: {}
			};

			await executeRequest(parsedRequest);

			const calledUrl = mockedAxios.mock.calls[0][0].url;
			expect(calledUrl).toContain('param1=value1');
			expect(calledUrl).toContain('param2=value2');
			expect(calledUrl).toContain('param3=123');
		});

		test('should handle URLs that already have query parameters', async () => {
			const mockResponse = { status: 200, data: {} };
			mockedAxios.mockResolvedValueOnce(mockResponse);

			const parsedRequest = {
				method: 'GET',
				url: 'https://example.com?existing=param',
				headers: {},
				query: { new: 'param' },
				body: {}
			};

			await executeRequest(parsedRequest);

			const calledUrl = mockedAxios.mock.calls[0][0].url;
			expect(calledUrl).toContain('existing=param');
			expect(calledUrl).toContain('new=param');
		});
	});

	describe('Timing', () => {
		test('should calculate duration correctly', async () => {
			// Mock different timestamps for start and stop
			Date.now
				.mockReturnValueOnce(1000) // start
				.mockReturnValueOnce(1500); // stop

			const mockResponse = { status: 200, data: {} };
			mockedAxios.mockResolvedValueOnce(mockResponse);

			const parsedRequest = {
				method: 'GET',
				url: 'https://example.com',
				headers: {},
				query: {},
				body: {}
			};

			const result = await executeRequest(parsedRequest);

			expect(result.response.duration).toBe(500);
			expect(result.response.request_start_timestamp).toBe(1000);
			expect(result.response.request_stop_timestamp).toBe(1500);
		});
	});
});