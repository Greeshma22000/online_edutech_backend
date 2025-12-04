const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const lessonRoutes = require('./routes/lesson.routes');
const quizRoutes = require('./routes/quiz.routes');
const progressRoutes = require('./routes/progress.routes');
const paymentRoutes = require('./routes/payment.routes');
const seedRoutes = require('./routes/seed.routes');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({
    name: 'Online_Edutech API',
    status: 'ok',
    docs: {
      health: '/health',
      auth: ['/auth/signup', '/auth/login', '/auth/profile'],
      courses: ['/courses', '/courses/:id'],
      lessons: ['/lessons/:courseId', '/lessons/stream/:id'],
      quiz: ['/quiz/:courseId', '/quiz/submit'],
      progress: ['/progress/:userId/:courseId', '/progress/update'],
      payment: ['/payment/create-checkout-session', '/payment/verify']
    }
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/lessons', lessonRoutes);
app.use('/quiz', quizRoutes);
app.use('/progress', progressRoutes);
app.use('/payment', paymentRoutes);
app.use('/seed', seedRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ API listening on :${PORT}`));