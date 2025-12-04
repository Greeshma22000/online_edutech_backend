const express = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth } = require('../middleware/supabaseAuth');
const jwt = require('jsonwebtoken');

const router = express.Router();

// POST /auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name, role = 'student' } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  // Auto-confirm user so login works immediately (no email verification needed)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error) return res.status(400).json({ message: error.message });
  
  // Update profiles table with role - wait a bit for trigger to create profile first
  const userId = data.user.id;
  console.log('Creating profile for user:', userId, 'with role:', role);
  
  // Wait a moment for the trigger to potentially create the profile
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Upsert profile with role - this will update if trigger created it, or create if it didn't
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      name: name,
      role: role,
    }, {
      onConflict: 'id'
    })
    .select();
  
  if (profileError) {
    console.error('Error updating profile:', profileError);
    // Try one more time after a longer delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { data: retryData, error: retryError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        name: name,
        role: role,
      }, {
        onConflict: 'id'
      })
      .select();
    
    if (retryError) {
      console.error('Retry also failed:', retryError);
    } else {
      console.log('Profile created/updated successfully on retry:', retryData);
    }
  } else {
    console.log('Profile created/updated successfully:', profileData);
  }
  
  // Return user with role included
  return res.json({ 
    user: {
      ...data.user,
      role: role
    }
  });
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  let { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error && /email not confirmed/i.test(error.message || '')) {
    // Try to confirm the user and retry once
    const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ email });
    const user = listed?.users?.[0];
    if (user) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
      const retried = await supabaseAdmin.auth.signInWithPassword({ email, password });
      data = retried.data;
      error = retried.error;
    }
  }
  if (error) return res.status(401).json({ message: error.message });
  const user = data.user;
  
  // Fetch role from profiles table if not in user_metadata
  let role = user.user_metadata?.role || 'student';
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }
  
  // Use role from profile if available, otherwise use user_metadata
  if (profile?.role) {
    role = profile.role;
    console.log('Role from profile:', role);
  } else {
    console.log('Role from user_metadata:', role);
  }
  
  const payload = {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || profile?.name,
    role: role,
  };
  
  console.log('Login payload:', payload);
  
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
  return res.json({ token, user: payload });
});

// GET /auth/profile
router.get('/profile', requireAuth, async (req, res) => {
  // Fetch latest role from profiles table to ensure it's up to date
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, name')
    .eq('id', req.user.id)
    .single();
  
  // Use role from profile if available, otherwise use JWT role
  const role = profile?.role || req.user.role || 'student';
  
  const user = {
    ...req.user,
    role: role,
    name: req.user.name || profile?.name,
  };
  
  res.json({ user });
});

module.exports = router;