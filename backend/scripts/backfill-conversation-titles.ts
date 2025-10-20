import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase';

function generateTitleFromText(text: string): string {
  if (!text) return 'Nueva conversación';
  let t = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, ' $1 ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\\\[[\s\S]*?\\\]/g, ' ')
    .replace(/\\\([\s\S]*?\\\)/g, ' ')
    .replace(/\$(?:[^$\n]+)\$/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/pregunta del estudiante\s*:\s*/i, ' ')
    .replace(/[\n\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!t) return 'Nueva conversación';

  const stopwords = new Set(['de','la','el','y','en','que','para','con','del','los','las','un','una','por','como','sobre','al','a','se','su','sus','lo','las','les','le']);
  const words = t.split(' ')
    .filter(w => !!w)
    .filter((w, idx) => idx === 0 || !stopwords.has(w.toLowerCase()));
  let candidate = words.slice(0, 8).join(' ');
  if (!candidate) candidate = t.split(' ').slice(0, 6).join(' ');

  candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1);
  if (candidate.length > 60) {
    const cut = candidate.slice(0, 60);
    const lastSpace = cut.lastIndexOf(' ');
    candidate = (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim() + '…';
  }
  return candidate || 'Nueva conversación';
}

async function main() {
  console.log('🔧 Backfilling conversation titles…');

  // Fetch conversations with missing or overly long titles
  const { data: conversations, error } = await supabaseAdmin
    .from('conversations')
    .select('id, title')
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!conversations || conversations.length === 0) {
    console.log('No hay conversaciones para actualizar.');
    return;
  }

  let updated = 0;
  for (const conv of conversations) {
    const currentTitle: string | null = (conv as any).title ?? null;
    const needsFix = !currentTitle || currentTitle.length > 80;
    if (!needsFix) continue;

    // Get first user message of the conversation
    const { data: msgs, error: msgErr } = await supabaseAdmin
      .from('messages')
      .select('content, role')
      .eq('conversation_id', (conv as any).id)
      .order('created_at', { ascending: true })
      .limit(3);

    if (msgErr) {
      console.warn('No se pudo leer mensajes para', (conv as any).id, msgErr.message);
      continue;
    }
    const firstUser = (msgs || []).find(m => (m as any).role === 'user');
    if (!firstUser) continue;

    const newTitle = generateTitleFromText((firstUser as any).content);
    if (!newTitle || newTitle === currentTitle) continue;

    const { error: updErr } = await supabaseAdmin
      .from('conversations')
      .update({ title: newTitle })
      .eq('id', (conv as any).id);

    if (updErr) {
      console.warn('No se pudo actualizar título para', (conv as any).id, updErr.message);
      continue;
    }
    updated++;
  }

  console.log(`✅ Títulos actualizados: ${updated}`);
}

main().catch(err => {
  console.error('❌ Error en backfill:', err);
  process.exit(1);
});
