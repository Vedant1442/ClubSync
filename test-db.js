import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hfstigsizzkozpoojfia.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmc3RpZ3Npenprb3pwb29qZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDc4NzQsImV4cCI6MjA5NDUyMzg3NH0.g9eoR_5Ipf5hzHAd12iOlD95VfssaH2WPOznaLcuwdA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
  console.log('Testing login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@clubsync.com',
    password: 'Password123!'
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
  } else {
    console.log('Auth Success! User ID:', authData.user.id);
  }

  console.log('\nTesting data fetch...');
  const { data: clubs, error: dbError } = await supabase.from('clubs').select('*');
  
  if (dbError) {
    console.error('DB Error:', dbError);
  } else {
    console.log('Clubs retrieved:', clubs.length);
    console.log(clubs);
  }
}

runTest();
