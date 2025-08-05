module.exports = {
	testEnvironment: 'node',
	collectCoverageFrom: [
		'src/**/*.js',
		'!src/index.js', // Exclude main server file from coverage
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	testMatch: [
		'**/__tests__/**/*.js',
		'**/?(*.)+(spec|test).js'
	],
	verbose: true,
	collectCoverage: false, // Only collect when explicitly requested
	coverageThreshold: {
		global: {
			branches: 85,
			functions: 85,
			lines: 85,
			statements: 85
		}
	}
};