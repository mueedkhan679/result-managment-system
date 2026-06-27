const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://koihrectipbnzbdplpkx.supabase.co','sb_publishable_0dDmcyUC-I49KE0zfLljSA_Y5UF2Sfj');
async function run() {
  const { data: pending, error: pendErr } = await supabase.rpc('admin_list_results', { status: 'pending' });
  console.log('pending count', pendErr ? pendErr.message : pending.length);
  const { data: published, error: pubErr } = await supabase.rpc('admin_list_results', { status: 'published' });
  console.log('published count', pubErr ? pubErr.message : published.length);
  const sample = pending && pending[0];
  if (sample) {
    console.log('sample pending', sample);
  }
  const anyPublished = published && published[0];
  if (anyPublished) {
    console.log('sample published', anyPublished);
    const { data: portal, error: portalErr } = await supabase.rpc('portal_get_results', { student_id: anyPublished.student_id });
    console.log('portal_get_results error', portalErr ? portalErr.message : null);
    console.log('portal_get_results data', portal);
  }
}
run().catch(err => { console.error('unexpected', err); process.exit(1); });
