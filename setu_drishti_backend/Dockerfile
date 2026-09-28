FROM python:3.10-slim

WORKDIR /app

# Install curl (needed by start.sh health check) + clean apt cache
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install all Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Make the startup script executable
RUN chmod +x start.sh

# Render sets $PORT at runtime; expose it so the platform can map it
EXPOSE 8000

# Use the unified startup script that launches uvicorn + simulator
CMD ["./start.sh"]
