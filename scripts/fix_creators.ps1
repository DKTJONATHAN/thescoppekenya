$ErrorActionPreference = "Stop"

# Only target the content creator files
$targetFiles = @(
    "za Entertainment.yml", "za ghafla.yml", "za mpasho.yml", "za-news.yml", 
    "za politics.yml", "za africa.yml", "za agriculture.yml", "za business.yml", 
    "za diano.yml", "za jaj.yml", "za lifestyle.yml", "za sports.yml", 
    "za technology.yml", "manyuo.yml", "automation.yml", "satirical-narrator.yml"
)

# UTF-8 with NO Byte Order Mark (BOM)
$utf8NoBom = New-Object System.Text.UTF8Encoding $False

foreach ($fileName in $targetFiles) {
    $filePath = Join-Path -Path ".github\workflows" -ChildPath $fileName
    
    if (Test-Path $filePath) {
        $content = Get-Content -Path $filePath -Raw

        $original = $content

        # Update MODELS_TO_TRY list
        $content = [System.Text.RegularExpressions.Regex]::Replace(
            $content, 
            'MODELS_TO_TRY\s*=\s*\[.*?\]', 
            'MODELS_TO_TRY = ["gemini-3-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash"]', 
            [System.Text.RegularExpressions.RegexOptions]::Multiline
        )

        # Update MODELS list
        $content = [System.Text.RegularExpressions.Regex]::Replace(
            $content, 
            'MODELS\s*=\s*\[.*?\]', 
            'MODELS = ["gemini-3-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash"]', 
            [System.Text.RegularExpressions.RegexOptions]::Multiline
        )

        # Update Exception handler for `e`
        $content = [System.Text.RegularExpressions.Regex]::Replace(
            $content, 
            'if\s*["'']429["'']\s*in\s*str\s*\(\s*e\s*\).*?:', 
            'if "429" in str(e) or "quota" in str(e).lower() or "rate" in str(e).lower() or "503" in str(e) or "unavailable" in str(e).lower() or "500" in str(e) or "overloaded" in str(e).lower() or "resource_exhausted" in str(e).lower():',
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

        # Update Exception handler for `err`
        $content = [System.Text.RegularExpressions.Regex]::Replace(
            $content, 
            'if\s*["'']429["'']\s*in\s*(?:str\s*\(\s*err\s*\)|err).*?:', 
            'if "429" in str(err) or "quota" in str(err).lower() or "rate" in str(err).lower() or "503" in str(err) or "unavailable" in str(err).lower() or "500" in str(err) or "overloaded" in str(err).lower() or "resource_exhausted" in str(err).lower():',
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )

        if ($content -cne $original) {
            Write-Host "Updated $fileName"
            [System.IO.File]::WriteAllText((Resolve-Path $filePath).Path, $content, $utf8NoBom)
        }
    } else {
        Write-Host "File not found: $fileName"
    }
}
Write-Host "All specified creator files processed."
