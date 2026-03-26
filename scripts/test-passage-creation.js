/* eslint-env node */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPassageCreation() {
  try {
    console.log('🧪 Testing passage creation with admin user...');

    // Login as admin
    const { data: _authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hex.ron07@gmail.com',
      password: 'admin123456',
    });

    if (authError) {
      throw new Error(`Login failed: ${authError.message}`);
    }

    console.log('✅ Admin logged in successfully');

    // Test creating a simple passage
    const testPassage = {
      title: 'Test Passage - RLS Fix Verification',
      content: 'This is a test passage to verify RLS policies are working.',
      test_type: 'reading',
      test_format: 'academic',
      topic: 'Technology',
      access_tier: 'free',
      is_active: true,
    };

    console.log('📝 Creating test passage...');
    const { data: passage, error: createError } = await supabase
      .from('passages')
      .insert(testPassage)
      .select()
      .single();

    if (createError) {
      throw new Error(
        `Passage creation failed: ${createError.message} (Code: ${createError.code})`
      );
    }

    console.log('✅ Passage created successfully!');
    console.log('📄 Passage ID:', passage.id);
    console.log('📝 Title:', passage.title);

    // Test updating the passage
    console.log('🔄 Testing passage update...');
    const { data: updatedPassage, error: updateError } = await supabase
      .from('passages')
      .update({ title: 'Updated Test Passage - RLS Fix Verification' })
      .eq('id', passage.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Passage update failed: ${updateError.message} (Code: ${updateError.code})`);
    }

    console.log('✅ Passage updated successfully!');
    console.log('📝 New title:', updatedPassage.title);

    // Clean up - delete the test passage
    console.log('🧹 Cleaning up test passage...');
    const { error: deleteError } = await supabase.from('passages').delete().eq('id', passage.id);

    if (deleteError) {
      console.warn('⚠️ Failed to delete test passage:', deleteError.message);
    } else {
      console.log('✅ Test passage deleted successfully');
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    console.log('\n🎉 All passage operations completed successfully!');
    console.log('✅ RLS policies are working correctly for admin users');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPassageCreation();
