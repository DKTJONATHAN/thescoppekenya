const fs = require('fs');
const path = require('path');

const workflowsDir = '.github/workflows';

function fixWorkflow(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const original = content;

    // 1. Fix excerpt_prompt missing closing parenthesis
    content = content.replace(
        /("Rules: Factual, no clickbait, starts with the subject or a verb, includes the key news fact. Output ONLY JSON: \{\\"excerpt\\": \\"...\\"\}")\n(\s+)excerpt_text/g,
        '$1\n$2          )\n$2excerpt_text'
    );

    // 2. Fix missing article_prompt assignment
    content = content.replace(
        /(# ── SEO IMPROVEMENT 2: Lede-first article structure for AI snippets ─────────\n)(\s+)"1\. Start with a/g,
        '$1$2article_prompt = (\n$2    "1. Start with a'
    );

    // 3. Fix unescaped quotes in prompts
    content = content.replace(/"This has caused a lot of online debate in Kenya" or "sparked a firestorm"/g, "'This has caused a lot of online debate in Kenya' or 'sparked a firestorm'");

    // 4. Fix floating strings inside AUTHOR_MAP (specifically for EEAT BUILDER.yml)
    content = content.replace(
        /("technology":\s+\("Celestine Nzioka",\s+"a precise Kenyan tech and business journalist covering Africa's digital economy"\),)\n\s+"1\. Start with a.*?\n\s+-[^\n]*?\n\s+-[^\n]*?\n/gs,
        '$1\n'
    );

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        return true;
    }
    return false;
}

fs.readdirSync(workflowsDir).forEach(filename => {
    if (filename.endsWith('.yml')) {
        if (fixWorkflow(path.join(workflowsDir, filename))) {
            console.log(`Fixed: ${filename}`);
        }
    }
});
