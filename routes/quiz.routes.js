const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth } = require('../middleware/supabaseAuth');

const router = express.Router();

// GET /quiz/:courseId
router.get('/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabaseAdmin.from('quizzes').select('*').eq('course_id', courseId).order('id', { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  // Ensure options is always an array
  const formatted = (data || []).map(q => ({
    ...q,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : (Array.isArray(q.options) ? q.options : [])
  }));
  res.json(formatted);
});

// POST /quiz/submit
router.post('/submit', requireAuth, async (req, res) => {
  const { courseId, answers } = req.body || {};
  const userId = req.user.id;
  if (!courseId || !Array.isArray(answers)) return res.status(400).json({ message: 'Invalid payload' });
  // Get questions with correct answers
  const { data: questions, error } = await supabaseAdmin.from('quizzes').select('id,correct_index').eq('course_id', courseId);
  if (error) return res.status(500).json({ message: error.message });
  let correct = 0;
  const indexById = new Map(answers.map((a) => [a.id, a.selected_index]));
  for (const q of questions || []) {
    if (indexById.get(q.id) === q.correct_index) correct += 1;
  }
  const score = questions?.length ? Math.round((correct / questions.length) * 100) : 0;
  
  // Save quiz attempt (optional - create quiz_attempts table if needed)
  // For now, just return the score
  
  res.json({ score, total: questions?.length || 0, correct, courseId });
});

module.exports = router;