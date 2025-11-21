import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/authRoutes.js';
import petRoutes from './routes/petRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pet Adoption API',
      version: '1.0.0',
      description: 'A comprehensive REST API for pet adoption system',
      contact: {
        name: 'API Support',
        email: 'support@petadoption.com'
      },
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://pet-adoption-backend-qw1r.onrender.com/' 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production'
          ? 'Production server'
          : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            name: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' }
          }
        },

        // ✅ UPDATED PET SCHEMA
        Pet: {
          type: 'object',
          required: ['name', 'species', 'breed', 'age', 'description', 'photoBase64'],
          properties: {
            name: { type: 'string', description: 'Pet name' },

            species: {
              type: 'string',
              enum: [
                'dog',
                'cat',
                'bird',
                'rabbit',
                'hamster',
                'guinea_pig',
                'fish',
                'reptile',
                'other'
              ],
              description: 'Pet species'
            },

            breed: { type: 'string' },

            age: {
              type: 'string',
              enum: ['baby', 'young', 'adult', 'senior'],
              description: 'Age category'
            },

            size: {
              type: 'string',
              enum: ['small', 'medium', 'large', 'extra_large']
            },

            gender: {
              type: 'string',
              enum: ['male', 'female', 'unknown']
            },

            healthStatus: {
              type: 'string',
              enum: ['excellent', 'good', 'fair', 'poor', 'critical']
            },

            temperament: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'calm',
                  'playful',
                  'shy',
                  'energetic',
                  'independent',
                  'affectionate',
                  'protective',
                  'social'
                ]
              }
            },

            // ✅ UPDATED to base64
            photoBase64: {
              type: 'string',
              description: 'Base64 encoded image',
              example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
            },

            description: { type: 'string' },

            status: {
              type: 'string',
              enum: ['available', 'pending', 'adopted', 'not_available', 'fostered']
            },

            adoptedBy: { type: 'string', format: 'objectid' },

            adoptionDate: { type: 'string', format: 'date-time' },

            isFeatured: { type: 'boolean' }
          }
        },

        Application: {
          type: 'object',
          required: ['petId', 'userMessage'],
          properties: {
            petId: { type: 'string', format: 'objectid' },
            userMessage: { type: 'string' },
            adminNotes: { type: 'string' }
          }
        },

        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' }
          }
        },

        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'objectid' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string', enum: ['user', 'admin'] }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  })
);

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/applications', applicationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
