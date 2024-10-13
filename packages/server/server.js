const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const storagePath = "public_files/the-corridor-demo-windows";

// Serve the manifest.json - Work on versioning in future
app.get("/manifest.json", (req, res) => {
  const manifestPath = path.join(
    __dirname,
    "/output_manifests/The_Corridor/The_Corridor_1.0.1_manifest.json"
  );
  if (fs.existsSync(manifestPath)) {
    res.sendFile(manifestPath);
  } else {
    res.status(404).send({ error: "Manifest not found." });
  }
});

// Serve static files from public_files
app.use("/public_files", express.static(path.join(__dirname, storagePath)));

// Health Check Endpoint
app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
