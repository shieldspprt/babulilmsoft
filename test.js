import { createClient } from '@supabase/supabase-js';
async function run() {
  const response = await fetch('https://ntohwovclsoffwummuxj.supabase.co/rest/v1/', {
    headers: {
      'apikey': 'sb_publishable_jnjnfY4TcmD9HxRSo2sgkw_Qb3Se89G',
      'Authorization': 'Bearer sb_publishable_jnjnfY4TcmD9HxRSo2sgkw_Qb3Se89G'
    }
  });
  const json = await response.json();
  const schemas = json.definitions || (json.components && json.components.schemas);
  console.log("PARENTS SCHEMA", JSON.stringify(schemas.parents, null, 2));
}
run();
