#!/usr/bin/env node
// Automated QA Checks for ilmsoft
// Run: node qa-checks.js

import fs from 'fs';
import path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function log(color, msg) {
  console.log(`${COLORS[color]}${msg}${COLORS.reset}`);
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

const SRC_DIR = './src';
let errors = 0;
let warnings = 0;

// ============================================
// CHECK 1: Find potentially unsafe queries
// ============================================
log('blue', '\n[CHECK 1] Unsafe Delete Operations (no error handling)');

const managersPattern = /handleDelete\s*=[\s\S]*?await\s+supabase\.[\s\S]*?\)[\s\S]*?setDeleting\(/g;
const srcFiles = fs.readdirSync(SRC_DIR, { recursive: true })
  .filter(f => f.endsWith('.tsx') && !f.includes('node_modules'))
  .map(f => `./src/${f}`);

srcFiles.forEach(file => {
  const content = readFileSafe(file);
  if (!content.includes('handleDelete')) return;
  
  // Check if delete has error handling
  if (content.includes('handleDelete') && !content.match(/handleDelete[\s\S]{1,500}\{[\s\S]*?error[\s\S]{1,200}\}/)) {
    log('yellow', `  ⚠️  ${file} - delete may lack error handling`);
    warnings++;
  }
  
  // Check for race conditions in credit updates
  if (content.includes('total_credits') && content.includes('school') && content.includes('+')) {
    if (!content.includes('increment') && !content.includes('rpc')) {
      log('red', `  ❌ ${file} - potential credit race condition`);
      errors++;
    }
  }
});

// ============================================
// CHECK 2: Schema Mismatches
// ============================================
log('blue', '\n[CHECK 2] Schema vs Component Mismatches');

const parentsSQL = readFileSafe('./db/parents_module.sql');
const parentsComponent = readFileSafe('./src/components/ParentsManager.tsx');

if (parentsSQL.includes('name text') && parentsComponent.includes('first_name')) {
  log('red', '  ❌ Parents: DB has "name" but component uses "first_name"/"last_name"');
  errors++;
}

const teachersSQL = readFileSafe('./db/teachers_module.sql');
const teachersComponent = readFileSafe('./src/components/TeachersManager.tsx');

if (teachersComponent.includes('type:') && !teachersSQL.includes('type')) {
  log('red', '  ❌ Teachers: Component uses "type" but column missing in schema');
  errors++;
}

// ============================================
// CHECK 3: Missing Add Buttons
// ============================================
log('blue', '\n[CHECK 3] Manager Toolbar Buttons');

const studentsManager = readFileSafe('./src/components/StudentsManager.tsx');
const hasStudentsAddButton = studentsManager.match(/<Button[^>]*>.*Add.*Student/);
if (!hasStudentsAddButton) {
  log('red', '  ❌ StudentsManager missing "Add Student" button');
  errors++;
}

// ============================================
// CHECK 4: Hardcoded Values
// ============================================
log('blue', '\n[CHECK 4] Hardcoded Configuration');

const dashboard = readFileSafe('./src/pages/Dashboard.tsx');
const adminDashboard = readFileSafe('./src/pages/AdminDashboard.tsx');

if (dashboard.includes('0300-1234567') || dashboard.includes('PK12MEZN000123456789')) {
  log('yellow', '  ⚠️  Dashboard has hardcoded payment details');
  warnings++;
}

// ============================================
// CHECK 5: Console Error Statements
// ============================================
log('blue', '\n[CHECK 5] Console Statements');

const consoleStatements = [];
srcFiles.forEach(file => {
  const content = readFileSafe(file);
  const matches = content.match(/console\.(log|error|warn|info)\([^)]*\);?/g);
  if (matches) {
    log('yellow', `  ⚠️  ${file} has ${matches.length} console statements`);
    warnings++;
  }
});

// ============================================
// CHECK 6: Missing TypeScript Types
// ============================================
log('blue', '\n[CHECK 6] Type Safety Issues');

srcFiles.forEach(file => {
  const content = readFileSafe(file);
  
  // Check for 'any' usage
  if (content.match(/:\s*any/)) {
    log('yellow', `  ⚠️  ${file} uses 'any' type`);
    warnings++;
  }
  
  // Check for non-null assertions
  if (content.includes('!.')) {
    log('yellow', `  ⚠️  ${file} uses non-null assertions (!.)`);
    warnings++;
  }
});

// ============================================
// CHECK 7: Security Issues
// ============================================
log('blue', '\n[CHECK 7] Security Checks');

srcFiles.forEach(file => {
  const content = readFileSafe(file);
  
  // Check for dangerouslySetInnerHTML
  if (content.includes('dangerouslySetInnerHTML')) {
    log('red', `  ❌ ${file} uses dangerouslySetInnerHTML`);
    errors++;
  }
  
  // Check for eval usage
  if (content.match(/\beval\s*\(/)) {
    log('red', `  ❌ ${file} uses eval()`);
    errors++;
  }
});

// ============================================
// SUMMARY
// ============================================
log('blue', '\n' + '='.repeat(50));
log(errors > 0 ? 'red' : 'green', `Errors: ${errors}`);
log(warnings > 0 ? 'yellow' : 'green', `Warnings: ${warnings}`);

if (errors === 0 && warnings === 0) {
  log('green', '\n✅ All checks passed!');
  process.exit(0);
} else {
  log(errors > 0 ? 'red' : 'yellow', '\n❌ Issues found. See above.');
  process.exit(errors > 0 ? 1 : 0);
}
