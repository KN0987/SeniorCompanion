const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'memories');
fs.ensureDirSync(uploadsDir);

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// In-memory storage for demonstration (in production, use a database)
let memories = [];
let reminders = [];
let chatHistory = [];
let emergencyContacts = [];

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Health & Wellness API is running',
    timestamp: new Date().toISOString()
  });
});

// Memory routes
app.get('/api/memories', (req, res) => {
  try {
    const sortedMemories = memories.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({
      success: true,
      data: sortedMemories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch memories',
      error: error.message
    });
  }
});

app.post('/api/memories', upload.single('image'), (req, res) => {
  try {
    const { title, description, location } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const memory = {
      id: uuidv4(),
      title: title || `Memory from ${new Date().toLocaleDateString()}`,
      description: description || 'A beautiful moment captured',
      location: location || 'Unknown location',
      image: `/uploads/memories/${req.file.filename}`,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    memories.push(memory);

    res.json({
      success: true,
      message: 'Memory added successfully',
      data: memory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add memory',
      error: error.message
    });
  }
});

app.delete('/api/memories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const memoryIndex = memories.findIndex(m => m.id === id);
    
    if (memoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found'
      });
    }

    // Delete the image file
    const memory = memories[memoryIndex];
    const imagePath = path.join(__dirname, memory.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    memories.splice(memoryIndex, 1);

    res.json({
      success: true,
      message: 'Memory deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete memory',
      error: error.message
    });
  }
});

// Reminder routes
app.get('/api/reminders', (req, res) => {
  try {
    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminders',
      error: error.message
    });
  }
});

app.post('/api/reminders', (req, res) => {
  try {
    const reminder = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reminders.push(reminder);

    res.json({
      success: true,
      message: 'Reminder created successfully',
      data: reminder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create reminder',
      error: error.message
    });
  }
});

app.put('/api/reminders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const reminderIndex = reminders.findIndex(r => r.id === id);
    
    if (reminderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    reminders[reminderIndex] = {
      ...reminders[reminderIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      data: reminders[reminderIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update reminder',
      error: error.message
    });
  }
});

app.delete('/api/reminders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const reminderIndex = reminders.findIndex(r => r.id === id);
    
    if (reminderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    reminders.splice(reminderIndex, 1);

    res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete reminder',
      error: error.message
    });
  }
});

// Chat routes
app.get('/api/chat/history', (req, res) => {
  try {
    res.json({
      success: true,
      data: chatHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
});

app.post('/api/chat/message', (req, res) => {
  try {
    const { message, isBot = false } = req.body;
    
    const chatMessage = {
      id: uuidv4(),
      message: message,
      isBot: isBot,
      timestamp: new Date().toISOString()
    };

    chatHistory.push(chatMessage);

    // Simple bot response logic
    if (!isBot) {
      setTimeout(() => {
        const botResponse = generateBotResponse(message);
        const botMessage = {
          id: uuidv4(),
          message: botResponse,
          isBot: true,
          timestamp: new Date().toISOString()
        };
        chatHistory.push(botMessage);
      }, 1000);
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: chatMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Simple bot response function
function generateBotResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  if (message.includes('happy') || message.includes('good') || message.includes('great')) {
    return "That's wonderful to hear! What's making you feel so positive today?";
  }
  
  if (message.includes('sad') || message.includes('down') || message.includes('depressed')) {
    return "I'm sorry you're feeling down. Would you like to talk about what's troubling you?";
  }
  
  if (message.includes('anxious') || message.includes('worried') || message.includes('stressed')) {
    return "It sounds like you're dealing with some stress. Take a deep breath. What's on your mind?";
  }
  
  if (message.includes('medication') || message.includes('pills')) {
    return "Are you having trouble with your medication routine? I can help you set up reminders.";
  }
  
  if (message.includes('exercise') || message.includes('workout')) {
    return "Exercise is great for both physical and mental health! What kind of activities do you enjoy?";
  }
  
  const responses = [
    "I understand. Can you tell me more about how you're feeling?",
    "Thank you for sharing that with me. How has your day been?",
    "I'm here to listen. What's been on your mind lately?",
    "That's interesting. How are you taking care of yourself today?",
    "I appreciate you opening up. Is there anything specific you'd like to discuss?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Emergency contacts routes
app.get('/api/emergency-contacts', (req, res) => {
  try {
    res.json({
      success: true,
      data: emergencyContacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts',
      error: error.message
    });
  }
});

app.post('/api/emergency-contacts', (req, res) => {
  try {
    const contact = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString()
    };

    emergencyContacts.push(contact);

    res.json({
      success: true,
      message: 'Emergency contact added successfully',
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add emergency contact',
      error: error.message
    });
  }
});

app.put('/api/emergency-contacts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contactIndex = emergencyContacts.findIndex(c => c.id === id);
    
    if (contactIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    emergencyContacts[contactIndex] = {
      ...emergencyContacts[contactIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Emergency contact updated successfully',
      data: emergencyContacts[contactIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency contact',
      error: error.message
    });
  }
});

app.delete('/api/emergency-contacts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const contactIndex = emergencyContacts.findIndex(c => c.id === id);
    
    if (contactIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    emergencyContacts.splice(contactIndex, 1);

    res.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete emergency contact',
      error: error.message
    });
  }
});

// SOS alert endpoint
app.post('/api/sos/alert', (req, res) => {
  try {
    const { location, message } = req.body;
    
    // In a real application, this would:
    // 1. Send SMS/calls to emergency contacts
    // 2. Alert emergency services
    // 3. Log the emergency event
    
    const alertData = {
      id: uuidv4(),
      location: location,
      message: message || 'Emergency alert triggered',
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Simulate sending alerts to emergency contacts
    console.log('🚨 EMERGENCY ALERT TRIGGERED:', alertData);
    console.log('📧 Sending alerts to emergency contacts...');
    
    res.json({
      success: true,
      message: 'Emergency alert sent successfully',
      data: alertData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send emergency alert',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Health & Wellness API server running on port ${PORT}`);
  console.log(`📱 Ready to serve mobile app requests`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});