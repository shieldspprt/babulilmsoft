import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntohwovclsoffwummuxj.supabase.co';
const supabaseKey = 'sb_publishable_jnjnfY4TcmD9HxRSo2sgkw_Qb3Se89G';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  
  try {
    // Test 1: Basic connection by fetching schools table
    console.log('1. Testing basic connection (schools table)...');
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, school_name, email')
      .limit(5);
    
    if (schoolsError) {
      console.log('   ❌ Schools query failed:', schoolsError.message);
    } else {
      console.log('   ✅ Schools table accessible');
      console.log('   Found', schools?.length || 0, 'school(s)');
    }

    // Test 2: Check credit_requests table
    console.log('\n2. Testing credit_requests table...');
    const { data: credits, error: creditsError } = await supabase
      .from('credit_requests')
      .select('id, status')
      .limit(1);
    
    if (creditsError) {
      console.log('   ❌ Credit requests query failed:', creditsError.message);
    } else {
      console.log('   ✅ Credit_requests table accessible');
    }

    // Test 3: Check auth service
    console.log('\n3. Testing Auth service...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('   ⚠️  Auth check:', authError.message);
    } else {
      console.log('   ✅ Auth service reachable');
      console.log('   Session:', session ? 'Active' : 'None');
    }

    // Test 4: Get all tables
    console.log('\n4. Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      // Fallback: try querying information_schema directly
      const { data: schemaTables, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (schemaError) {
        console.log('   ⚠️  Could not list tables:', schemaError.message);
      } else {
        console.log('   ✅ Found', schemaTables?.length || 0, 'tables in public schema');
        const tableNames = schemaTables?.map(t => t.table_name).join(', ') || 'none';
        console.log('   Tables:', tableNames);
      }
    } else {
      console.log('   Tables:', tables);
    }

    console.log('\n✅ Database connection test completed!');

  } catch (err) {
    console.error('\n❌ Connection test failed:', err);
    process.exit(1);
  }
}

testConnection();
