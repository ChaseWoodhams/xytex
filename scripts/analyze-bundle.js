#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * 
 * Analyzes the Next.js bundle size and provides insights for optimization.
 * Run with: node scripts/analyze-bundle.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Analyzing Next.js bundle...\n');

try {
  // Build the project
  console.log('Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if .next/analyze directory exists
  const analyzeDir = path.join(process.cwd(), '.next', 'analyze');
  
  if (fs.existsSync(analyzeDir)) {
    console.log('\n✅ Bundle analysis complete!');
    console.log('Check .next/analyze for detailed reports.\n');
  } else {
    console.log('\n⚠️  Bundle analyzer not configured.');
    console.log('To enable, add @next/bundle-analyzer to your project.\n');
  }

  // Check bundle sizes
  const buildDir = path.join(process.cwd(), '.next', 'static');
  if (fs.existsSync(buildDir)) {
    console.log('📊 Bundle size summary:');
    console.log('Check .next/static for chunk sizes.\n');
  }
} catch (error) {
  console.error('❌ Error analyzing bundle:', error.message);
  process.exit(1);
}

