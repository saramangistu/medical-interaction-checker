require('dotenv').config();

module.exports = {
  mongo: {
    uri: process.env.MONGO_URI
  },
  imagga: {
    key: process.env.IMAGGA_API_KEY,
    secret: process.env.IMAGGA_API_SECRET,
    baseUrl: 'https://api.imagga.com/v2'
  },
  usda: {
    key: process.env.USDA_API_KEY,
    baseUrl: 'https://api.nal.usda.gov/fdc/v1'
  },
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'deepseek-r1:latest'
  }
};