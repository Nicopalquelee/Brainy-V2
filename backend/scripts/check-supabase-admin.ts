import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase';

(async () => {
  try {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      console.error('admin.listUsers error:', error.message);
      process.exit(2);
    }
    const count = data?.users?.length ?? 0;
    console.log('OK: admin.listUsers succeeded. users:', count);
    process.exit(0);
  } catch (e: any) {
    console.error('Exception:', e?.message || e);
    process.exit(1);
  }
})();
