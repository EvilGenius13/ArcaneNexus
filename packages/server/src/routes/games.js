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