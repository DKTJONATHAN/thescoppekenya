import fs from 'fs';
import path from 'path';

const workflowsDir = '.github/workflows';
const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml'));

const repMap = {
    "ðŸ“°": "📰",
    "ðŸš€": "🚀",
    "ðŸ ›ï¸ ": "🏛️",
    "ðŸŽ­": "🎭",
    "ðŸ’¼": "💼",
    "ðŸŒ¾": "🌾",
    "ðŸ †": "🏆",
    "ðŸ“¨": "📨",
    "ðŸ“º": "📺",
    "ðŸ“±": "📱",
    "ðŸ’¬": "💬",
    "ðŸ“¢": "📢",
};

files.forEach(file => {
    const filePath = path.join(workflowsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    Object.keys(repMap).forEach(key => {
        content = content.split(key).join(repMap[key]);
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Repaired ${file}`);
    } else {
        // Even if no emoji fix, rewrite to ensure UTF-8 No BOM
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
console.log('All workflows processed.');
