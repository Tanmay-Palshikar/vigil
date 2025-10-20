# Vigil.ai Risk Analysis API Documentation

## Overview
This document describes the newly implemented risk analysis system for vigil.ai, which uses Google's Gemini AI to analyze content for potential risks including reputational, security, and compliance issues.

## API Endpoints

### 1. Health Check
- **GET** `/health`
- **Description**: Basic health check endpoint
- **Response**: 
```json
{
  "ok": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

### 2. Start Risk Analysis Scan
- **POST** `/api/scan/start`
- **Headers**: 
  - `Authorization: Bearer <jwt_token>` (required)
  - `x-ai-provider: gemini` (optional, defaults to 'gemini')
- **Description**: Initiates a risk analysis scan for all monitored URLs in the user's client profile
- **Response**:
```json
{
  "success": true,
  "message": "Scan completed. Processed 3 URLs.",
  "data": {
    "totalUrls": 3,
    "successfulAnalyses": 3,
    "failedAnalyses": 0,
    "results": [
      {
        "url": "https://example.com",
        "incidentId": "65a1b2c3d4e5f6789abcdef0",
        "analysis": {
          "isRisk": true,
          "riskCategory": "Security",
          "riskLevel": "High",
          "justification": "Potential security vulnerability detected...",
          "mitigationStrategy": "Immediate patching recommended..."
        }
      }
    ]
  },
  "aiProvider": "gemini"
}
```

### 3. Get Risk Incidents
- **GET** `/api/incidents`
- **Headers**: `Authorization: Bearer <jwt_token>` (required)
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20)
  - `riskCategory` (optional): Filter by category (Reputational, Security, Compliance, None, All)
  - `riskLevel` (optional): Filter by level (High, Medium, Low, None, All)
  - `isRisk` (optional): Filter by risk status (true, false)
- **Response**:
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "_id": "65a1b2c3d4e5f6789abcdef0",
        "clientProfile": "65a1b2c3d4e5f6789abcdef1",
        "sourceUrl": "https://example.com",
        "scrapedContentSnippet": "Sample content...",
        "aiAnalysis": {
          "isRisk": true,
          "riskCategory": "Security",
          "riskLevel": "High",
          "justification": "Detailed analysis...",
          "mitigationStrategy": "Recommended actions..."
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalIncidents": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 4. Get Specific Incident
- **GET** `/api/incidents/:id`
- **Headers**: `Authorization: Bearer <jwt_token>` (required)
- **Description**: Get details of a specific risk incident

### 5. Get Risk Statistics
- **GET** `/api/incidents/stats/summary`
- **Headers**: `Authorization: Bearer <jwt_token>` (required)
- **Description**: Get summary statistics of risk incidents
- **Response**:
```json
{
  "success": true,
  "data": {
    "totalIncidents": 100,
    "riskIncidents": 25,
    "noRiskIncidents": 75,
    "riskPercentage": 25,
    "categoryBreakdown": [
      { "_id": "Security", "count": 15 },
      { "_id": "Reputational", "count": 8 },
      { "_id": "Compliance", "count": 2 }
    ],
    "levelBreakdown": [
      { "_id": "High", "count": 5 },
      { "_id": "Medium", "count": 12 },
      { "_id": "Low", "count": 8 }
    ]
  }
}
```

## Postman Test Steps

### Prerequisites
1. Ensure the server is running on `http://localhost:5001`
2. Have a valid JWT token from authentication
3. Have a client profile set up for the authenticated user
4. Set up environment variables in Postman:
   - `base_url`: `http://localhost:5001`
   - `auth_token`: Your JWT token

### Test Collection

#### 1. Health Check
```
GET {{base_url}}/health
```
**Expected**: 200 OK with health status

#### 2. Start Risk Analysis Scan
```
POST {{base_url}}/api/scan/start
Headers:
  Authorization: Bearer {{auth_token}}
  x-ai-provider: gemini
```
**Expected**: 200 OK with scan results

#### 3. Get All Incidents
```
GET {{base_url}}/api/incidents
Headers:
  Authorization: Bearer {{auth_token}}
```
**Expected**: 200 OK with paginated incidents

#### 4. Get Incidents with Filters
```
GET {{base_url}}/api/incidents?riskCategory=Security&riskLevel=High&page=1&limit=10
Headers:
  Authorization: Bearer {{auth_token}}
```
**Expected**: 200 OK with filtered incidents

#### 5. Get Risk Statistics
```
GET {{base_url}}/api/incidents/stats/summary
Headers:
  Authorization: Bearer {{auth_token}}
```
**Expected**: 200 OK with risk statistics

#### 6. Get Specific Incident
```
GET {{base_url}}/api/incidents/{incident_id}
Headers:
  Authorization: Bearer {{auth_token}}
```
**Expected**: 200 OK with incident details

## Environment Variables Required

Create a `.env` file in the `server/` directory with:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/vigil-ai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Server Configuration
PORT=5001
NODE_ENV=development
```

## Installation Steps

1. Install dependencies:
```bash
cd server
npm install
```

2. Set up environment variables (see above)

3. Start the server:
```bash
npm start
```

## AI Analysis Schema

The Gemini AI returns analysis in the following JSON schema:

```json
{
  "isRisk": boolean,
  "riskCategory": "Reputational" | "Security" | "Compliance" | "None",
  "riskLevel": "High" | "Medium" | "Low" | "None",
  "justification": string,
  "mitigationStrategy": string
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

Common HTTP status codes:
- `200`: Success
- `401`: Unauthorized (invalid/missing token)
- `404`: Resource not found
- `500`: Internal server error

## Security Notes

- All API keys are stored in environment variables
- JWT tokens are required for all protected endpoints
- Input validation is performed on all requests
- AI responses are validated against the expected schema
- No sensitive data is logged in production
