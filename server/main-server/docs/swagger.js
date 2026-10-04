const swaggerJsdoc = require('swagger-jsdoc');

const swaggerServerUrl = process.env.SWAGGER_SERVER_URL || 'http://localhost:7000/api';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eGAuth API',
      version: '1.0.0',
      description: 'Core endpoints for eGAuth main server',
    },
    servers: [
      { url: swaggerServerUrl }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/login/userLogin': {
        post: {
          tags: ['Auth'],
          summary: 'User login',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: { 200: { description: 'OK' } },
        },
      },
      '/login/empLogin': {
        post: {
          tags: ['Auth'],
          summary: 'Employee login',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: { 200: { description: 'OK' } },
        },
      },
      '/login/deptLogin': {
        post: {
          tags: ['Auth'],
          summary: 'Department login',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: { 200: { description: 'OK' } },
        },
      },
      '/register/userRegister': {
        post: {
          tags: ['Register'],
          summary: 'User registration',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/register/deptRegister': {
        post: {
          tags: ['Register'],
          summary: 'Department registration',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/admin/addDept': {
        post: {
          tags: ['Admin'],
          summary: 'Create department (admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/dept/addEmp': {
        post: {
          tags: ['Department'],
          summary: 'Create employee',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/user/scan': {
        post: {
          tags: ['Secondary'],
          summary: 'Verify QR scan (secondary server)',
          responses: { 200: { description: 'OK' } },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
