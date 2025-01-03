import express from "express";
import cors from 'cors'
import adminRoutes from "./routes/admin";
import routes from "./routes";
import { initializeBuckets } from "./utils/minio"
import { initializeDatabase } from "./utils/sqlite";

const app = express();
const PORT = 3000;

const gameFileBucketName: string = 'game-assets';

// Cors
app.use(cors({
  origin: 'http://localhost:4000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));


app.use('/api', routes);
app.use('/admin', adminRoutes);

// JSON Parsing
app.use(express.json());

const startServer = async () => {
  try {

    // Initialize SQLite database
    await initializeDatabase();

    // Initialize MinIO buckets
    await initializeBuckets([gameFileBucketName]);
    
    console.log(`MinIO buckets initialized successfully.`);
    app.listen(PORT, () => {
      console.log(`👾 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
