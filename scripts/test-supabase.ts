#!/usr/bin/env tsx
/**
 * Script kiểm tra kết nối Supabase
 * Chạy: npx tsx scripts/test-supabase.ts
 */
import { createAdminClient } from '../src/lib/supabase';

async function main() {
  console.log('🔌 Testing Supabase connection...\n');

  const supabase = createAdminClient();

  // Test 1: Kiểm tra kết nối
  const { data: version, error: versionError } = await supabase.rpc('version').select();
  if (versionError) {
    console.error('❌ Connection failed:', versionError.message);
    process.exit(1);
  }
  console.log('✅ Connected to Supabase');

  // Test 2: Đếm categories
  const { count: catCount, error: catError } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });
  if (catError) throw catError;
  console.log(`📁 Categories: ${catCount}`);

  // Test 3: Đếm sources
  const { count: srcCount, error: srcError } = await supabase
    .from('sources')
    .select('*', { count: 'exact', head: true });
  if (srcError) throw srcError;
  console.log(`📡 Sources: ${srcCount}`);

  // Test 4: Đếm articles
  const { count: artCount, error: artError } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });
  if (artError) throw artError;
  console.log(`📰 Articles: ${artCount}`);

  // Test 5: Đếm hot_keywords
  const { count: kwCount, error: kwError } = await supabase
    .from('hot_keywords')
    .select('*', { count: 'exact', head: true });
  if (kwError) throw kwError;
  console.log(`🔥 Hot keywords: ${kwCount}`);

  console.log('\n✅ All tests passed!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
