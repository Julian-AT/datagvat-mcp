# Based on E2B Next.js example, adapted for React + Vite + Tailwind + shadcn
# This template provides a pre-configured environment for React development.

# Use official Node.js image (E2B supported)
FROM node:20-slim

# Set working directory
WORKDIR /home/user/app

# Install system dependencies if needed (e.g. git)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Pre-install global tools
RUN npm install -g vite

# Initialize Vite project (React + TypeScript)
# We do this during build to speed up startup
RUN npm create vite@latest . -- --template react-ts

# Install project dependencies
RUN npm install

# Install Tailwind CSS
RUN npm install -D tailwindcss postcss autoprefixer
RUN npx tailwindcss init -p

# Install shadcn/ui dependencies (lucide, clsx, etc.)
RUN npm install lucide-react class-variance-authority clsx tailwind-merge

# Configure Vite to expose host (required for E2B access)
# We'll modify vite.config.ts at runtime or here
RUN echo "import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()], server: { host: '0.0.0.0', port: 3000 } });" > vite.config.ts

# Setup basic Tailwind config
RUN echo "/** @type {import('tailwindcss').Config} */ module.exports = { content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'], theme: { extend: {}, }, plugins: [], }" > tailwind.config.js

# Add basic CSS for Tailwind
RUN echo "@tailwind base; @tailwind components; @tailwind utilities;" > src/index.css

# Expose port 3000
EXPOSE 3000

# Start command (can be overridden)
CMD ["npm", "run", "dev"]
