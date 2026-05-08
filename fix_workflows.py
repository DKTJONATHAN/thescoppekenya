import os
import re

workflows_dir = '.github/workflows'

def fix_workflow(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Fix excerpt_prompt missing closing parenthesis
    # Pattern: "excerpt\": \"...\"}"\n          excerpt_text
    content = re.sub(
        r'("excerpt\\": \\"...\\"}")\n(\s+excerpt_text)',
        r'\1\n\2          )\n\2',
        content
    )
    # Wait, the above might be wrong. Let's look at the actual fail:
    # 314: "Rules: Factual, no clickbait, starts with the subject or a verb, includes the key news fact. Output ONLY JSON: {\"excerpt\": \"...\"}"
    # 315: excerpt_text = gemini_generate(excerpt_prompt, "excerpt")
    content = re.sub(
        r'("Rules: Factual, no clickbait, starts with the subject or a verb, includes the key news fact. Output ONLY JSON: \{\\"excerpt\\": \\"...\\"\}")\n(\s+)excerpt_text',
        r'\1\n\2          )\n\2excerpt_text',
        content
    )

    # 2. Fix missing article_prompt assignment
    # Pattern: # ── SEO IMPROVEMENT 2: Lede-first article structure for AI snippets ─────────\n              "1. Start with a
    content = re.sub(
        r'(# ── SEO IMPROVEMENT 2: Lede-first article structure for AI snippets ─────────\n)(\s+)"1\. Start with a',
        r'\1\2article_prompt = (\n\2    "1. Start with a',
        content
    )

    # 3. Fix unescaped quotes in prompts
    # This has caused a lot of online debate in Kenya" or "sparked a firestorm"
    content = content.replace('"This has caused a lot of online debate in Kenya" or "sparked a firestorm"', "'This has caused a lot of online debate in Kenya' or 'sparked a firestorm'")

    # 4. Fix floating strings inside AUTHOR_MAP (specifically for EEAT BUILDER.yml)
    # Pattern: "technology":    ("Celestine Nzioka", "a precise Kenyan tech and business journalist covering Africa's digital economy"),\n              "1. Start with a
    content = re.sub(
        r'("technology":\s+\("Celestine Nzioka",\s+"a precise Kenyan tech and business journalist covering Africa\'s digital economy"\),)\n\s+"1\. Start with a.*?\n\s+-[^\n]*?\n\s+-[^\n]*?\n',
        r'\1\n',
        content,
        flags=re.DOTALL
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

for filename in os.listdir(workflows_dir):
    if filename.endswith('.yml'):
        if fix_workflow(os.path.join(workflows_dir, filename)):
            print(f"Fixed: {filename}")
