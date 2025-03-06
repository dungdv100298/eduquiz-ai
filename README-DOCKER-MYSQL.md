# EduQuiz API - Docker MySQL Setup

This guide will help you set up and run MySQL with Docker for your EduQuiz NestJS API.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your system

## MySQL Docker Setup

The project includes a `docker-compose.yml` file that configures MySQL for you. Here's how to use it:

### Starting MySQL

```bash
# Navigate to the project directory
cd eduquiz-api

# Start the MySQL container
docker-compose up -d
```

This will:
1. Pull the MySQL 8.0 image (if not already downloaded)
2. Create a container named `eduquiz-mysql`
3. Setup MySQL with the credentials defined in the docker-compose.yml
4. Make MySQL accessible on port 3306
5. Create a persistent volume for your data

### Checking MySQL Status

```bash
# Check if the container is running
docker ps

# See the logs
docker logs eduquiz-mysql
```

### Stopping MySQL

```bash
# Stop the MySQL container
docker-compose down

# To completely remove the container and volume
docker-compose down -v
```

## Database Connection Details

The application is configured to connect to the MySQL database with these settings:

- **Host**: localhost
- **Port**: 3306
- **Username**: eduquiz
- **Password**: eduquiz123
- **Database**: eduquiz

These settings are loaded from the `.env` file, which you can modify as needed.

## Connecting to MySQL

You can connect to the MySQL database using a MySQL client like MySQL Workbench, DBeaver, or the command line:

```bash
# Using the MySQL command line client
docker exec -it eduquiz-mysql mysql -ueduquiz -peduquiz123

# This connects you to the MySQL shell, where you can run SQL commands:
# mysql> USE eduquiz;
# mysql> SHOW TABLES;
```

## Troubleshooting

If you encounter issues:

1. **Port conflict**: If port 3306 is already in use, modify the port mapping in `docker-compose.yml`
2. **Connection issues**: Ensure Docker is running and the container has started properly
3. **Permission problems**: On some systems, you might need to run Docker commands with `sudo` 