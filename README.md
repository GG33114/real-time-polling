# Real-Time Polling API

This is my submission for the **Move37 Ventures Backend Developer Challenge**.  
It is a backend service for a real-time polling application built with modern technologies.  

Users can:  
- Create accounts and log in  
- Create polls with multiple options  
- Vote on poll options (only once per poll)  
- Get live results via WebSockets  

---

## 🛠 Tech Stack
- **Node.js + Express** – backend framework  
- **PostgreSQL + Prisma** – relational database & ORM  
- **Socket.IO** – real-time updates  
- **JWT** – authentication  

---

## ⚙️ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/Sarfarazshaikh08/real-time-polling.git
cd real-time-polling
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Copy `.env.example` → `.env` and fill in your database + JWT secret:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="supersecretkey123"
PORT=4000
```

### 4. Setup database
Run Prisma migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Start server
```bash
npm run dev
```

Server will run at:  
👉 `http://localhost:4000`

---

## 📌 API Endpoints

### 1. **Signup**
`POST /users`  
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

### 2. **Login**
`POST /auth/login`  
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "token": "JWT_TOKEN",
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com" }
}
```

### 3. **Create Poll** (JWT required)  
`POST /polls`  
Headers:
```
Authorization: Bearer <token>
```
Body:
```json
{
  "question": "Best programming language?",
  "creatorId": 1,
  "isPublished": true,
  "options": ["JavaScript", "Python", "Java"]
}
```

### 4. **Get Poll** (JWT required)  
`GET /polls/:id`  
Response includes options + vote counts.

### 5. **Vote** (JWT required)  
`POST /votes`  
```json
{
  "userId": 1,
  "pollId": 1,
  "pollOptionId": 2
}
```

Response:
```json
{
  "ok": true,
  "voteId": 1,
  "results": [
    { "id": 1, "text": "JavaScript", "voteCount": 0 },
    { "id": 2, "text": "Python", "voteCount": 1 },
    { "id": 3, "text": "Java", "voteCount": 0 }
  ]
}
```

---

## 🔴 WebSockets (Real-Time Updates)

When a vote is cast, the backend broadcasts live results to all clients in that poll room.  

### How to Test
You can connect with any **Socket.IO client** (Node.js, browser, Postman WebSocket).  
Join a room with:  
```js
socket.emit("join_poll", <pollId>);
```

And listen for updates:  
```js
socket.on("vote_update", (payload) => {
  console.log("Live results:", payload);
});
```

---

## ✅ Notes
- Passwords are hashed with **bcrypt**.  
- Each user can vote **only once per poll**.  
- Routes `/polls` and `/votes` are **JWT protected**.  
