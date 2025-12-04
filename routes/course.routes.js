const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth, requireRole } = require('../middleware/supabaseAuth');

const router = express.Router();

// GET /courses
router.get('/', async (_req, res) => {
  try {
    // Try to order by created_at, but if it doesn't exist, just select all
    let query = supabaseAdmin.from('courses').select('*');
    
    // Check if created_at column exists by trying to order by it
    const { data, error } = await query.order('id', { ascending: false });
    
    if (error) {
      // If ordering fails, try without order
      const { data: dataNoOrder, error: errorNoOrder } = await supabaseAdmin.from('courses').select('*');
      if (errorNoOrder) {
        console.error('Supabase error fetching courses:', errorNoOrder);
        return res.status(500).json({ message: errorNoOrder.message, details: errorNoOrder });
      }
      return res.json(dataNoOrder || []);
    }
    
    res.json(data || []);
  } catch (err) {
    console.error('Error in GET /courses:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// GET /courses/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin.from('courses').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ message: 'Course not found' });
  res.json(data);
});

// POST /courses (Instructor or Admin)
router.post('/', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const { title, description, thumbnail_url, is_premium = false, price = 0 } = req.body || {};
  const instructor_id = req.user.id;
  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert([{ title, description, instructor_id, thumbnail_url, is_premium, price }])
    .select()
    .single();
  if (error) return res.status(400).json({ message: error.message });
  res.status(201).json(data);
});

// PATCH /courses/:id
router.patch('/:id', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin.from('courses').update(req.body).eq('id', id).select().single();
  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

// DELETE /courses/:id
router.delete('/:id', requireAuth, requireRole(['instructor', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('courses').delete().eq('id', id);
  if (error) return res.status(400).json({ message: error.message });
  res.status(204).send();
});

module.exports = router;