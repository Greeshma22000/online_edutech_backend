const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth } = require('../middleware/supabaseAuth');

const router = express.Router();

// GET /progress/:userId/:courseId
router.get('/:userId/:courseId', requireAuth, async (req, res) => {
  const { userId, courseId } = req.params;
  if (req.user.id !== userId) return res.status(403).json({ message: 'Forbidden' });
  const { data, error } = await supabaseAdmin
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();
  
  // If no progress found, return default progress object
  if (error || !data) {
    return res.json({
      user_id: userId,
      course_id: courseId,
      completed_percent: 0,
      last_watched_lesson_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  res.json(data);
});

// POST /progress/update
router.post('/update', requireAuth, async (req, res) => {
  const { courseId, completedPercent } = req.body || {};
  const userId = req.user.id;
  const payload = { user_id: userId, course_id: courseId, completed_percent: completedPercent };
  const { data, error } = await supabaseAdmin.from('progress').upsert(payload, { onConflict: 'user_id,course_id' }).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

module.exports = router;