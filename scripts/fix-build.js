import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const distIndexPath = join(process.cwd(), 'dist', 'index.html');

try {
  let content = readFileSync(distIndexPath, 'utf-8');

  // 修复 style 标签：移除不应该存在的 rel 和 crossorigin 属性
  content = content.replace(/<style\s+rel=["']stylesheet["']\s+crossorigin>/g, '<style>');
  content = content.replace(/<style\s+crossorigin\s+rel=["']stylesheet["']>/g, '<style>');
  content = content.replace(/<style\s+rel=["']stylesheet["']>/g, '<style>');
  content = content.replace(/<style\s+crossorigin>/g, '<style>');

  writeFileSync(distIndexPath, content, 'utf-8');
  console.log('✅ Fixed style tag in dist/index.html');
} catch (error) {
  console.error('❌ Error fixing build:', error);
  process.exit(1);
}

