# Meet - One-to-One Video Calling Web App

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://meet.jaypatel.digital/)

Meet is an open-source web application that enables seamless one-to-one video calling directly from a browser—no downloads required. Built with modern web technologies, Meet provides a fast, secure, and intuitive way to connect with others in real-time.

## 🚀 Features

- 📹 **One-to-One Video Calling** – High-quality, real-time video communication.
- 🔒 **Peer-to-Peer Connection** – Uses WebRTC and PeerJS for a direct and secure connection.
- ⚡ **Fast & Lightweight** – Built with Vite for an optimized development and runtime experience.
- 🎨 **Modern UI** – Styled with Tailwind CSS for a sleek and responsive design.
- 📡 **Real-Time Signaling** – Socket.io ensures smooth connection handling.

## 🛠️ Tech Stack

**Frontend:** React, TypeScript, PeerJS, Tailwind CSS, Socket.io-client, Vite  
**Backend:** Node.js, Express, Socket.io

## 📌 Live Demo

Try it now: **[meet.jaypatel.digital](https://meet.jaypatel.digital/)**

## 🚀 Getting Started

### Prerequisites

- Node.js (v22.14.0 or higher)
- pnpm (v10.5.2 or higher)

### Installation & Setup

1. Clone the repository

```bash
git clone https://github.com/jaypatel1210/meet.git
cd meet
```

2. Install dependencies for both client and server

```bash
# Install client dependencies
cd client
pnpm install

# Install server dependencies
cd ../server
pnpm install
```

3. Set up environment variables

```bash
# Configure your environment variables in .env file
```

4. Start the development servers

```bash
# Start the server (in server directory)
pnpm dev

# Start the client (in client directory)
pnpm dev
```

5. Open your browser and navigate to `http://localhost:5173` to see the app running.
