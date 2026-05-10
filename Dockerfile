# Step 1: Build React Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend-react/package*.json ./
RUN npm install
COPY frontend-react/ ./
RUN npm run build

# Step 2: Setup Python Backend
FROM python:3.10-slim
WORKDIR /app

# Install Git (Required for the agent)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy backend and install requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend from Step 1
# We expect main.py to serve this folder
COPY --from=frontend-build /app/frontend/dist ./frontend-dist

# Copy backend code
COPY backend/ ./

# Command to run the unified server
EXPOSE 8000
CMD ["python", "main.py"]
