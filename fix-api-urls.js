const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if file contains localhost:3001
    if (!content.includes('localhost:3001')) {
        return false;
    }

    // Check if import already exists
    const hasImport = content.includes("import { API_URL }") || content.includes("import {API_URL}");

    // Add import after "use client" if not exists
    if (!hasImport) {
        // Try with different line endings
        content = content.replace(
            /"use client"\r?\n\r?\n/,
            '"use client"\n\nimport { API_URL } from \'@/lib/api/client\'\n'
        );
    }

    // Replace fetch URLs - need to replace both quote AND close the template literal properly
    // Pattern: 'http://localhost:3001/path' -> `${API_URL}/path`
    content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, '`${API_URL}$1`');

    // Also handle backtick strings that already use template literals
    // Pattern: `http://localhost:3001/path/${var}` -> `${API_URL}/path/${var}`
    content = content.replace(/`http:\/\/localhost:3001/g, '`${API_URL}');

    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

function walkDir(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            count += walkDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            if (processFile(filePath)) {
                console.log('Updated:', filePath.replace(srcDir, ''));
                count++;
            }
        }
    }
    return count;
}

const updated = walkDir(srcDir);
console.log(`\nTotal files updated: ${updated}`);
