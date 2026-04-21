import { supabase } from '../lib/supabase';

export const diagnoseSupabaseConnection = async () => {
  const results = {
    connectionTest: false,
    sessionTest: false,
    userTest: false,
    databaseTest: false,
    region: '',
    timing: {} as Record<string, number>
  };

  try {
    // Test 1: Basic connection
    console.log('🔍 Testing Supabase connection...');
    const start1 = Date.now();
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    results.timing.session = Date.now() - start1;
    
    if (!sessionError && sessionData) {
      results.connectionTest = true;
      results.sessionTest = !!sessionData.session;
      console.log(`✅ Session test: ${results.timing.session}ms`);
    }

    // Test 2: User fetch
    if (results.sessionTest) {
      const start2 = Date.now();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      results.timing.user = Date.now() - start2;
      
      if (!userError && userData.user) {
        results.userTest = true;
        console.log(`✅ User test: ${results.timing.user}ms`);
      }
    }

    // Test 3: Simple database query
    const start3 = Date.now();
    const { data: dbData, error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    results.timing.database = Date.now() - start3;
    
    if (!dbError) {
      results.databaseTest = true;
      console.log(`✅ Database test: ${results.timing.database}ms`);
    } else {
      console.log('❌ Database error:', dbError.message);
    }

    // Test 4: Check Supabase region/URL
    results.region = process.env.EXPO_PUBLIC_SUPABASE_URL || 'URL not found';
    console.log(`🌍 Supabase URL: ${results.region}`);

    return results;

  } catch (error) {
    console.error('❌ Connection diagnostic failed:', error);
    return results;
  }
};

// Simple password update test with detailed logging
export const testPasswordUpdate = async (newPassword: string) => {
  console.log('🔐 Starting password update test...');
  
  try {
    const startTime = Date.now();
    
    // Try with a promise that includes detailed error info
    const updatePromise = supabase.auth.updateUser({ password: newPassword });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Password update timeout after ${Date.now() - startTime}ms`));
      }, 10000); // 10 second timeout
    });

    const result = await Promise.race([updatePromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Password update completed in ${duration}ms`);
    return { success: true, duration, result };
    
  } catch (error: any) {
    const duration = Date.now() - Date.now();
    console.log(`❌ Password update failed: ${error.message}`);
    return { success: false, duration, error: error.message };
  }
};