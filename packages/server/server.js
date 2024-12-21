const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3001;
app.use(cors());

const storagePath = "public_files/the-corridor-demo-windows";

// Serve the manifest.json
app.get("/manifest.json", (req, res) => {
  const projectName = req.query.projectName;
  const version = req.query.version;

  if (!projectName || !version) {
    return res
      .status(400)
      .send({ error: "Project name and version are required." });
  }

  const manifestPath = path.join(
    __dirname,
    `/output_manifests/${projectName}/${projectName}_${version}_manifest.json`
  );

  if (fs.existsSync(manifestPath)) {
    res.sendFile(manifestPath);
  } else {
    res.status(404).send({ error: "Manifest not found." });
  }
});

// Serve static files from public_files
app.use("/public_files", express.static(path.join(__dirname, storagePath)));

// Grabs each project and returns project list with nested metadata
app.get("/project_list", (req, res) => {
  const outputFolder = path.join(__dirname, "/output_manifests/");
  const projects = fs.readdirSync(outputFolder);
  const projectDict = {};

  projects.forEach((project) => {
    const gameFolder = path.join(outputFolder, project);
    const files = fs.readdirSync(gameFolder);

    files.forEach((file) => {
      if (path.extname(file) === ".json") {
        const manifestPath = path.join(gameFolder, file);
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

        if (!projectDict[project]) {
          projectDict[project] = [];
        }

        projectDict[project].push({
          generatedAt: manifest.generatedAt,
          version: manifest.version,
          pathToProjectLogo: manifest.pathToProjectLogo,
          pathToProjectImageURL: manifest.pathToProjectImageURL,
        });
      }
    });
  });

  res.send(projectDict);
});

// Health Check Endpoint
app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
