const fs = require('fs');
let jsonStr = fs.readFileSync('explanation.md', 'utf8').trim();

const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
}

console.log("Starts with '{'?", jsonStr.startsWith('{'));
console.log("Regex match?", /^\s*"/.test(jsonStr));

if (!jsonStr.startsWith('{') && /^\s*"/.test(jsonStr)) {
    console.log("Wrapping with { }");
    jsonStr = '{' + jsonStr;
}
if (!jsonStr.endsWith('}')) {
    jsonStr = jsonStr + '}';
}

jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

try {
    const parsed = JSON.parse(jsonStr);
    console.log("Parsed keys:", Object.keys(parsed));
} catch (e) {
    console.error("Parse Error:", e.message);
    const match = e.message.match(/position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        console.log("Error around:", jsonStr.substring(Math.max(0, pos - 20), pos + 20));
    }
}
