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