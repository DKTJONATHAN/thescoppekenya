$workflowsDir = ".github/workflows"
$files = Get-ChildItem -Path "$workflowsDir/*.yml"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $original = $content

    # 1. Fix excerpt_prompt missing closing parenthesis
    $content = $content -replace '("Rules: Factual, no clickbait, starts with the subject or a verb, includes the key news fact. Output ONLY JSON: \{\\"excerpt\\": \\"...\\"\}")\n(\s+)excerpt_text', '$1' + "`n" + '$2          )' + "`n" + '$2excerpt_text'

    # 2. Fix missing article_prompt assignment
    $content = $content -replace '(# ── SEO IMPROVEMENT 2: Lede-first article structure for AI snippets ─────────\n)(\s+)"1\. Start with a', '$1$2article_prompt = (' + "`n" + '$2    "1. Start with a'

    # 3. Fix unescaped quotes in prompts
    $content = $content.Replace('"This has caused a lot of online debate in Kenya" or "sparked a firestorm"', "'This has caused a lot of online debate in Kenya' or 'sparked a firestorm'")

    # 4. Fix floating strings inside AUTHOR_MAP (specifically for EEAT BUILDER.yml)
    # This might need a more complex regex in PS
    $content = $content -replace '("technology":\s+\("Celestine Nzioka",\s+"a precise Kenyan tech and business journalist covering Africa''s digital economy"\),)\r?\n\s+"1\. Start with a.*?\r?\n\s+-[^\r\n]*?\r?\n\s+-[^\r\n]*?\r?\n', '$1' + "`r`n"

    if ($content -ne $original) {
        $content | Set-Content -Path $file.FullName -NoNewline
        Write-Host "Fixed: $($file.Name)"
    }
}
