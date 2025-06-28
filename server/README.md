# Health & Wellness API Server

Backend server for the Health & Wellness mobile application built with Node.js and Express.

## Features

- **Memory Management**: Upload and manage photo memories with timeline
- **Reminder System**: CRUD operations for medication and exercise reminders
- **AI Chatbot**: Simple conversational AI for mood tracking and support
- **Emergency Contacts**: Manage emergency contacts and SOS alerts
- **File Upload**: Secure image upload with validation
- **RESTful API**: Clean, organized endpoints for all features

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Memories
- `GET /api/memories` - Fetch all memories
- `POST /api/memories` - Create new memory (with image upload)
- `DELETE /api/memories/:id` - Delete memory

### Reminders
- `GET /api/reminders` - Fetch all reminders
- `POST /api/reminders` - Create new reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

### Chat
- `GET /api/chat/history` - Fetch chat history
- `POST /api/chat/message` - Send message to chatbot

### Emergency Contacts
- `GET /api/emergency-contacts` - Fetch emergency contacts
- `POST /api/emergency-contacts` - Add emergency contact
- `PUT /api/emergency-contacts/:id` - Update emergency contact
- `DELETE /api/emergency-contacts/:id` - Delete emergency contact

### SOS
- `POST /api/sos/alert` - Trigger emergency alert

## File Upload

Images are uploaded to the `/uploads/memories/` directory with the following specifications:
- Maximum file size: 10MB
- Allowed formats: JPEG, JPG, PNG, GIF
- Files are renamed with UUID for security

## Data Storage

Currently using in-memory storage for demonstration purposes. In production, integrate with:
- PostgreSQL or MongoDB for persistent data
- AWS S3 or similar for file storage
- Redis for caching and sessions

## Security Features

- CORS enabled for cross-origin requests
- File type validation for uploads
- File size limits
- Input sanitization
- Error handling middleware

## Development

The server includes:
- Hot reloading with nodemon
- Structured error responses
- Comprehensive logging
- Modular route organization

## Production Deployment

For production deployment:
1. Set NODE_ENV=production
2. Use a process manager like PM2
3. Set up reverse proxy with Nginx
4. Configure SSL certificates
5. Set up database connections
6. Configure external file storage

## Integration with Mobile App

The mobile app should connect to this server by:
1. Setting the base URL in the app configuration
2. Using the provided endpoints for all data operations
3. Handling file uploads through the memories endpoint
4. Implementing proper error handling for API calls