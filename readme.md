# ArcaneNexus

ArcaneNexus is a custom game launcher inspired by World of Warcraft. It integrates a client launcher, server management, and a manifest generator, providing a unified platform for an enhanced gaming experience.

## 🧙‍♂️ Features
- Game Launcher: Built with Electron, offering a user-friendly interface to launch and manage game clients.
- Server: An Express-based server that handles game manifests and client-server interactions.
- Manifest Generator: A tool to scan directories and generate JSON manifests for game files.
- (Coming Soon) Docker Support: Easily deploy and manage the server using Docker Compose.
- Modular Monorepo: Organized with npm workspaces for streamlined dependency management and development.

### 📁 Directory Structure
```
ArcaneNexus/
├── packages/
│   ├── server/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── package.json
│   │   └── src/
│   ├── generator/
│   │   ├── package.json
│   │   └── src/
│   └── launcher/
│       ├── package.json
│       └── src/
├── package.json
├── lerna.json (optional, if using Lerna)
├── README.md
└── .gitignore
```

### 🚀 Getting Started
📦 Prerequisites
- Node.js (v14 or later)
- npm (v7 or later)
- Docker (optional, for server deployment)

### 🛠️ Installation
1. Clone the Repository

```bash
git clone https://github.com/EvilGenius13/ArcaneNexus.git
cd ArcaneNexus
```

2. Install Dependencies

```bash
Copy code
npm install
```
This command installs dependencies for all workspaces (server, generator, launcher).

### ⚙️ Configuration
1. Server Configuration

- Navigate to the server directory:

```bash
cd packages/server
```
- Create a `.env` file based on `.env.example` and configure your environment variables.