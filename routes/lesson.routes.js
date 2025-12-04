const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth } = require('../middleware/supabaseAuth');

const router = express.Router();

// GET /lessons/:courseId
router.get('/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('position', { ascending: true });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
});

// GET /lessons/stream/:id (signed URL)
router.get('/stream/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data: lesson, error } = await supabaseAdmin.from('lessons').select('*').eq('id', id).single();
  if (error || !lesson) return res.status(404).json({ message: 'Lesson not found' });
  // Assuming video_path stored in storage bucket 'videos'
  const { data: signed, error: urlErr } = await supabaseAdmin.storage
    .from('videos')
    .createSignedUrl(lesson.video_path, 60 * 60); // 1 hour
  if (urlErr) return res.status(500).json({ message: urlErr.message });
  res.json({ url: signed?.signedUrl });
});

module.exports = router;