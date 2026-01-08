#!/usr/bin/env node

/**
 * Build-time script that detects new posts and submits them to IndexNow.
 * This runs during Vercel build to automatically index new content.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT_DIR, 'content/posts');
const CACHE_FILE = path.join(ROOT_DIR, '.posts-cache.json');
const HOST = process.env.SITE_HOST || 'thescoopkenya.vercel.app';

async function getExistingPosts() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      return new Set(cache.posts || []);
    }
  } catch (e) {
    console.log('No cache file found, treating all posts as new');
  }
  return new Set();
}

function getCurrentPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => f.replace('.md', ''));
}

function extractSlugFromFile(filename) {
  const filePath = path.join(POSTS_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract slug from frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const slugMatch = frontmatterMatch[1].match(/slug:\s*["']?([^"'\n]+)["']?/);
    if (slugMatch) {
      return slugMatch[1].trim();
    }
  }
  
  // Fallback to filename
  return filename.replace('.md', '');
}

async function submitToIndexNow(urls) {
  const apiKey = process.env.INDEXNOW_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  INDEXNOW_API_KEY not set, skipping submission');
    return false;
  }

  const payload = {
    host: HOST,
    key: apiKey,
    keyLocation: `https://${HOST}/${apiKey}.txt`,
    urlList: urls
  };

  console.log(`📤 Submitting ${urls.length} URL(s) to IndexNow:`, urls);

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.status === 200 || response.status === 202) {
      console.log('✅ Successfully submitted to IndexNow');
      return true;
    } else {
      console.error(`❌ IndexNow API returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to submit to IndexNow:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n🔍 Checking for new posts to index...\n');

  const existingPosts = await getExistingPosts();
  const currentPostFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  
  const newPosts = [];
  const allSlugs = [];

  for (const file of currentPostFiles) {
    const slug = extractSlugFromFile(file);
    allSlugs.push(slug);
    
    if (!existingPosts.has(slug)) {
      newPosts.push(slug);
    }
  }

  if (newPosts.length === 0) {
    console.log('📝 No new posts detected\n');
  } else {
    console.log(`📝 Found ${newPosts.length} new post(s):`, newPosts);
    
    const urls = newPosts.map(slug => `https://${HOST}/article/${slug}`);
    await submitToIndexNow(urls);
  }

  // Update cache
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ 
    posts: allSlugs,
    lastUpdated: new Date().toISOString()
  }, null, 2));
  
  console.log('💾 Cache updated\n');
}

main().catch(console.error);
