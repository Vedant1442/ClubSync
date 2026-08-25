import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hfstigsizzkozpoojfia.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmc3RpZ3Npenprb3pwb29qZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NDc4NzQsImV4cCI6MjA5NDUyMzg3NH0.g9eoR_5Ipf5hzHAd12iOlD95VfssaH2WPOznaLcuwdA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testAuth() {
  console.log('Testing Registration...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'newtest@clubsync.com',
    password: 'Password123!',
    options: {
      data: {
        full_name: 'New Test User'
      }
    }
  });

  if (signUpError) {
    console.error('Signup Error:', signUpError.message);
  } else {
    console.log('Signup Success! User ID:', signUpData?.user?.id);
  }

  console.log('\nTesting Login...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@clubsync.com',
    password: 'Password123!'
  });

  if (signInError) {
    console.error('Login Error:', signInError.message);
  } else {
    console.log('Login Success! Session exists:', !!signInData?.session);
  }
}

testAuth();
