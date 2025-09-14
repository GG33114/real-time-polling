require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const usersRouter = require('./routes/users');
const pollsRouter = require('./routes/polls');
const votesRouter = require('./routes/votes');
const authRouter = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// make io available in req.app
app.set('io', io);

app.use(cors());
app.use(express.json());

// Public routes
app.use('/users', usersRouter);
app.use('/auth', authRouter);

// Protected routes
app.use('/polls', authMiddleware, pollsRouter);
app.use('/votes', authMiddleware, votesRouter);

// simple health
app.get('/', (req, res) => res.send({ ok: true }));

// Socket behavior: clients join poll rooms to receive updates
io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  socket.on('join_poll', (pollId) => {
    const room = `poll_${pollId}`;
    socket.join(room);
    console.log(`${socket.id} joined ${room}`);
  });

  socket.on('leave_poll', (pollId) => {
    const room = `poll_${pollId}`;
    socket.leave(room);
    console.log(`${socket.id} left ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
