<p align="center"><img src="/assets/physiq-api.png" alt="project-image"></p>

<p id="description">PhysiQ API — an Express.js server that powers the PhysiQ platform of applications with RESTful endpoints for authentication, training logs, check-ins, health metrics, and integrations.</p>

<p align="center"><img src="https://img.shields.io/badge/version-1.0.0-blue" alt="shields"><img src="https://img.shields.io/badge/contributors-1-green" alt="shields"><img src="https://img.shields.io/badge/status-stable-green" alt="shields"></p>

<h2>🚀 Demo</h2>

[https://physiq-api.onrender.com](https://physiq-api.onrender.com)

<h2>🔒 Authentication</h2>

You will need a Clerk authentication token to make requests to this API.

<h2>🛠️ Installation Steps:</h2>

<p>1. Clone the repository</p>

```
git clone repo_url
```

<p>2. Install npm modules</p>

```
npm install
```

<p>3. Start development server using below command</p>

```
npm start
```

<h2>🔧 Environment Variables</h2>

The following environment variables need to be configured in your `.env` file:

### **Database Configuration**

- `MYSQL_CONNECTION_HOST` - MySQL database host address
- `MYSQL_USER` - MySQL database username
- `MYSQL_PASSWORD` - MySQL database password
- `MYSQL_DATABASE` - MySQL database name
- `MYSQL_PORT` - MySQL database port (default: 3306)

### **Authentication**

- `CLERK_SECRET_KEY` - Clerk authentication service secret key for token validation

### **AWS Configuration**

- `AWS_PUBLIC_ACCESS_KEY` - AWS access key ID for S3 services
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key for S3 services
- `AWS_REGION` - AWS region for S3 buckets (e.g., us-east-2)

### **AWS S3 Buckets**

- `CHECKIN_BUCKET` - S3 bucket name for storing check-in photos
- `GYM_PHOTOS_BUCKET` - S3 bucket name for storing gym location photos
- `POSE_CLASSIFICATION_BUCKET` - S3 bucket name for storing pose classification images

### **External Integrations**

- `OURA_INTEGRATION_API_KEY` - API key for Oura Ring health data integration
- `MAPBOX_API_TOKEN` - Mapbox API token for location services

### **Email Configuration**

- `GMAIL_USER` - Gmail address for sending emails
- `GMAIL_PASSWORD` - Gmail app password for SMTP authentication

### **Application Settings**

- `NODE_ENV` - Environment mode (`development`, `production`, `test`)
- `PORT` - Server port (optional, defaults to 3000)
- `DEBUG` - Debug logging configuration for Clerk (optional)
- `TEST_API_KEY` - API key for testing purposes

### **Example .env file:**

```properties
# Database
MYSQL_CONNECTION_HOST="your-mysql-host"
MYSQL_USER="your-username"
MYSQL_PASSWORD="your-password"
MYSQL_DATABASE="your-database"
MYSQL_PORT="3306"

# Authentication
CLERK_SECRET_KEY="your-clerk-secret-key"

# AWS
AWS_PUBLIC_ACCESS_KEY="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-2"

# S3 Buckets
CHECKIN_BUCKET="your-checkin-bucket"
GYM_PHOTOS_BUCKET="your-gym-photos-bucket"
POSE_CLASSIFICATION_BUCKET="your-pose-bucket"

# Integrations
OURA_INTEGRATION_API_KEY="your-oura-api-key"
MAPBOX_API_TOKEN="your-mapbox-token"

# Email
GMAIL_USER="your-email@gmail.com"
GMAIL_PASSWORD="your-app-password"

# Application
NODE_ENV="development"
DEBUG="clerk:*"
TEST_API_KEY="your-test-key"
```

<h2>🍰 Contribution Guidelines:</h2>

Please contribute using GitHub Flow. Create a branch add commits and open a pull request.

<h2>💻 Built with</h2>

Technologies used in the project:

- Express.js
- Clerk
- AWS S3
- AWS EC2
- MySQL

<h2>🛡️ License:</h2>

This project is licensed under the This project is licensed under the MIT License.
