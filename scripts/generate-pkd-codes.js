const https = require('https');
const fs = require('fs');
const path = require('path');

// Fetch PKD codes from pkd.com.pl
function fetchPKDCodes() {
  return new Promise((resolve, reject) => {
    const url = 'https://www.pkd.com.pl/wyszukiwarka/lista_pkd';
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const pkdCodes = parsePKDCodes(data);
          resolve(pkdCodes);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Parse PKD codes from HTML content
function parsePKDCodes(html) {
  const codes = [];
  
  // Multiple regex patterns to catch different formats
  const patterns = [
    // Pattern 1: [PKD XX.XX.X](link) followed by [Description](link)
    /\[PKD\s+(\d{2}\.\d{2}\.[A-Z])\]\([^)]+\)\s*\n\[([^\]]+)\]/g,
    // Pattern 2: PKD XX.XX.X followed by description in text
    /PKD\s+(\d{2}\.\d{2}\.[A-Z])[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]*([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ][^[\n]*)/g,
    // Pattern 3: Direct code and name extraction
    /(\d{2}\.\d{2}\.[A-Z])[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+([A-ZĄĆĘŁŃÓŚŹŻ][^[\n]{10,})/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const code = match[1];
      let name = match[2].trim();
      
      // Clean up the name
      name = name.replace(/\]\([^)]*\)$/, ''); // Remove trailing links
      name = name.replace(/^\[/, ''); // Remove leading bracket
      name = name.replace(/\]$/, ''); // Remove trailing bracket
      name = name.replace(/\s+/g, ' '); // Normalize whitespace
      
      if (code && name && name.length > 5 && !name.includes('PKD')) {
        codes.push({ code, name });
      }
    }
  });
  
  // Remove duplicates and sort by code
  const uniqueCodes = codes.filter((item, index, self) => 
    index === self.findIndex(t => t.code === item.code)
  );
  
  return uniqueCodes.sort((a, b) => a.code.localeCompare(b.code));
}

// Generate TypeScript file content
function generateTypeScriptFile(pkdCodes) {
  const header = `// Auto-generated PKD codes list
// Source: https://www.pkd.com.pl/wyszukiwarka/lista_pkd
// Generated on: ${new Date().toISOString()}

export interface PKDCode {
  code: string;
  name: string;
}

export const PKD_CODES: PKDCode[] = [`;

  const codeEntries = pkdCodes.map(({ code, name }) => 
    `  { code: '${code}', name: '${name.replace(/'/g, "\\'")}' }`
  ).join(',\n');

  const footer = `\n];

export default PKD_CODES;
`;

  return header + '\n' + codeEntries + footer;
}

// Main function
async function main() {
  try {
    console.log('Fetching PKD codes from pkd.com.pl...');
    const pkdCodes = await fetchPKDCodes();
    
    console.log(`Found ${pkdCodes.length} PKD codes`);
    
    // Generate TypeScript content
    const tsContent = generateTypeScriptFile(pkdCodes);
    
    // Write to file
    const outputPath = path.join(__dirname, '../src/config/pkdCodes.ts');
    fs.writeFileSync(outputPath, tsContent, 'utf8');
    
    console.log(`PKD codes written to ${outputPath}`);
    console.log('First 5 codes:');
    pkdCodes.slice(0, 5).forEach(({ code, name }) => {
      console.log(`  ${code}: ${name}`);
    });
    
  } catch (error) {
    console.error('Error generating PKD codes:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
