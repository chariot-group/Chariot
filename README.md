# Chariot
Chariot is a companion app designed for Dungeon Masters of Dungeons & Dragons, especially those who play in person. Its goal is to simplify campaign preparation, management, and tracking through a modern, intuitive, and streamlined interface. Unlike virtual tabletop tools, Chariot focuses on narrative structure and visual clarity, helping DMs stay organized and fully immerse their players in engaging, story-driven sessions.

👉 Learn more and join us at https://chariot.tools


## 📚 Documentation

### 🔧 Development
- [Contribution](CONTRIBUTING.md) - How to contribute to the project

### 🛠️ Technical
- [Technical documentation](docs/technical/README.md) - API, architecture, frontend, backend

## 🏗️ Architecture

**Monorepo**: Next.js (frontend) + NestJS (backend) + MongoDB + Docker

## 🚀 Getting Started

### 1. Environment
a. Copy the example environment file
```bash
cp .env.example .env
```

b. Edit the environment variables as needed
```bash
nano .env
#--or--#
vim .env
```

### 2. Install dependencies

Install the required dependencies for both frontend and backend:

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 3. Start the project with Docker

Make sure Docker is installed on your machine.

To start all services (frontend, backend, database, etc.):

```bash
docker compose up
```

## 🌱 Seeder (optional)

A **seeder** system is available to inject test data into the database.

- To run the seeder:

  ```bash
  docker compose exec backend npm run seed
  ```

- To clear existing data and reseed cleanly:

  ```bash
  docker compose exec backend npm run seed:clean
  ```

## License

This project is proprietary. All rights reserved. See the [LICENSE](LICENSE) file for more information.