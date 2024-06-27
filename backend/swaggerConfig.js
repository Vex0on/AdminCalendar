const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CalendarApp API Documentation',
      version: '1.0.0',
      description: 'Full API documentation of whole CalendarApp',
    },
  },
  apis: ['./routes/index.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
