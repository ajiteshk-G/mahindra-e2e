FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends     curl     ca-certificates     && curl -fsSL https://deb.nodesource.com/setup_20.x | bash -     && apt-get install -y --no-install-recommends nodejs     && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy Backend application
COPY backend ./backend

# Copy Frontend, install dependencies, and build Next.js production app
COPY frontend ./frontend
RUN cd ./frontend && npm install --legacy-peer-deps && npm run build

# Copy entrypoint runner
COPY entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

ENV PROJECT_ID="mb-poc-352009"
ENV LOCATION="us-central1"
ENV PORT=8080
ENV ENABLE_SMS_DISPATCH="true"

EXPOSE 8080

CMD ["./entrypoint.sh"]
