#!/usr/bin/env node

/**
 * Build-time script that detects new posts and submits them to IndexJump.
 * This runs during Vercel build to automatically index new content.
 */

import { execSync } from 'child_process';
import path from 'path';

const INDEXJUMP_API_KEY = process.env.INDEXJUMP_API_KEY;
const SITE_URL = 'https://thescoopkenya.vercel.app';

if (!INDEXJUMP_API_KEY) {
  console.log('⚠️  INDEXJUMP_API_KEY environment variable not set, skipping indexing');
  process.exit(0);
}

console.log('🔍 Checking for new posts...');

async function main() {
  try {
    const gitOutput = execSync('git diff --name-only HEAD~1 HEAD', { 
      encoding: 'utf8'
    }).trim();

    if (!gitOutput) {
      console.log('📝 No changes detected');
      process.exit(0);
    }

    const changedFiles = gitOutput.split('\n');
    const newPostFiles = changedFiles.filter(file => 
      file.includes('content/posts/') && file.endsWith('.md')
    );

    if (newPostFiles.length === 0) {
      console.log('📝 No new posts found');
      process.exit(0);
    }

    console.log(`🚀 Found ${newPostFiles.length} new posts, submitting...`);

    let successful = 0;
    for (const file of newPostFiles) {
      const slug = path.basename(file, '.md').toLowerCase();
      const url = `${SITE_URL}/article/${slug}`;

      try {
        const indexUrl = `https://api.indexjump.com/index?url=${encodeURIComponent(url)}&token=${INDEXJUMP_API_KEY}`;
        const response = await fetch(indexUrl);

        if (response.ok) {
          console.log(`✅ Indexed: ${url}`);
          successful++;
        } else {
          const result = await response.text();
          console.log(`❌ Failed: ${url} - ${result}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.log(`❌ Error: ${url} - ${error.message}`);
      }
    }

    console.log(`\n📤 Successfully indexed ${successful}/${newPostFiles.length} posts`);

  } catch (error) {
    // Git might fail on first commit or shallow clone
    console.log('⚠️  Git error (possibly first build):', error.message);
    console.log('📝 Skipping indexing for this build');
  }
}

main().catch(console.error);
