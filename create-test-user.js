import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hfstigsizzkozpoojfia.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmc3RpZ3Npenprb3pwb29qZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDc4NzQsImV4cCI6MjA5NDUyMzg3NH0.g9eoR_5Ipf5hzHAd12iOlD95VfssaH2WPOznaLcuwdA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createTestUser() {
  console.log('Creating test user...');
  const { data, error } = await supabase.auth.signUp({
    email: 'demo' + Date.now() + '@clubsync.com',
    password: 'Password123!',
    options: {
      data: {
        name: 'Demo User'
      }
    }
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('User created successfully!');
    console.log('User ID:', data.user.id);
  }
}

createTestUser();
