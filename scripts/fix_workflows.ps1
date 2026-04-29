$ErrorActionPreference = "Stop"
$files = Get-ChildItem -Path ".github\workflows" -Filter "*.yml"

foreach ($file in $files) {
    if ($file.Name -eq "za diano.yml" -or $file.Name -like "*") {
        $content = Get-Content -Path $file.FullName -Raw

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
            Write-Host "Updated $($file.Name)"
            # Use ASCII or UTF8 encoding safely
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        }
    }
}
Write-Host "All files processed."
