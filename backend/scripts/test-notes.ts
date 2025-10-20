import 'dotenv/config';
import { supabaseAdmin as supabase } from '../src/config/supabase';

(async () => {
  try {
    const { data: notes, error: en } = await supabase.from('notes').select('*').limit(1);
    console.log('notes error:', en?.message || 'none', 'rows:', notes?.length ?? 0);

    const { data: profiles, error: ep } = await supabase.from('profiles').select('*').limit(1);
    console.log('profiles error:', ep?.message || 'none', 'rows:', profiles?.length ?? 0);
  } catch (e: any) {
    console.error('Exception:', e?.message || e);
    process.exit(1);
  }
})();
