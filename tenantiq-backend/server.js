require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/config/database');
const { createPublicSchema } = require('./src/utils/schemaManager');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected');

    await createPublicSchema();
    console.log('Public schema ready');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();