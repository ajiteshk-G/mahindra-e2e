FROM python:3.11-slim
WORKDIR /app

# Install Node.js runtime and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy Backend application
COPY backend ./backend

# Copy Frontend application and Next.js compiled build
COPY frontend ./frontend
COPY frontend/next_build ./frontend/.next

# Copy entrypoint runner
COPY entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

ENV PROJECT_ID="mb-poc-352009"
ENV LOCATION="us-central1"
ENV PORT=8080

EXPOSE 8080

CMD ["./entrypoint.sh"]
