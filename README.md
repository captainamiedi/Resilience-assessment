# Reqline Parser

A curl-like tool parser that processes reqline statements and executes HTTP requests.

## Overview

This Node.js application parses reqline statements with a specific syntax and executes the corresponding HTTP requests using axios. The parser is built without using regex, following strict syntax rules.

## Syntax

```
HTTP [method] | URL [URL value] | HEADERS [header json value] | QUERY [query value json] | BODY [body value json]
```

### Rules

- All keywords are UPPERCASE: `HTTP`, `HEADERS`, `QUERY`, `BODY`
- Single delimiter: pipe `|`
- Exactly one space on each side of keywords and delimiters
- HTTP methods: `GET` or `POST` only (uppercase)
- `HTTP` and `URL` are required and must be in fixed order (first two)
- Other keywords (`HEADERS`, `QUERY`, `BODY`) can appear in any order or be omitted

### Valid Examples

```
HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {"refid": 1920933}
HTTP GET | URL https://dummyjson.com/quotes/3 | HEADERS {"Content-Type": "application/json"} | QUERY {"refid": 1920933}
HTTP POST | URL https://httpbin.org/post | BODY {"name": "test", "value": 123}
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server runs on port 3000 by default (or PORT environment variable).

## API Endpoint

### POST /

Accepts requests in the format:
```json
{
  "reqline": "[REQLINE STATEMENT]"
}
```

#### Success Response (HTTP 200)
```json
{
  "request": {
    "query": {"refid": 1920933},
    "body": {},
    "headers": {},
    "full_url": "https://dummyjson.com/quotes/3?refid=1920933"
  },
  "response": {
    "http_status": 200,
    "duration": 347,
    "request_start_timestamp": 1691234567890,
    "request_stop_timestamp": 1691234568237,
    "response_data": {
      "id": 3,
      "quote": "Thinking is the capital, Enterprise is the way, Hard Work is the solution.",
      "author": "Abdul Kalam"
    }
  }
}
```

#### Error Response (HTTP 400)
```json
{
  "error": true,
  "message": "Specific reason for the error"
}
```

## Error Messages

The parser provides specific error messages for various syntax violations:

- "Missing required HTTP keyword"
- "Missing required URL keyword"
- "Invalid HTTP method. Only GET and POST are supported"
- "HTTP method must be uppercase"
- "Invalid spacing around pipe delimiter"
- "Invalid JSON format in HEADERS section"
- "Invalid JSON format in QUERY section"
- "Invalid JSON format in BODY section"
- "Keywords must be uppercase"
- "Missing space after keyword"
- "Multiple spaces found where single space expected"

## Testing

Run the test examples:
```bash
node test-examples.js
```

## Project Structure

```
src/
├── index.js                 # Main server file
├── parser/
│   └── reqlineParser.js     # Reqline parser (no regex)
└── services/
    └── requestService.js    # HTTP request execution service
```

## Health Check

GET `/health` - Returns service status