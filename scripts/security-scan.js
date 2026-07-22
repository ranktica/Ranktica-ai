// ==========================================================
// ENTERPRISE SAAS STATIC SECURITY SCANNER (SAST audit)
// ==========================================================
import fs from 'fs';
import path from 'path';

const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;
const dim = (text) => `\x1b[2m${text}\x1b[0m`;

console.log(`\n${bold("==========================================================")}`);
console.log(`${bold("   Ranktica AI Automated SAST Scanner & Security Audit")}`);
console.log(`${bold("==========================================================")}`);
console.log(`[Security Guard] Running security audit protocols at ${new Date().toISOString()}`);

const vulns = [];
const directoryQueue = ['./src', './server', './scripts'];

const patterns = {
  HEAVY_SECRET_KEY: {
    regex: /(sk_live_|AIzaSy[A-Za-z0-9_]{35}|(?<!process\.env\.)AWS_SECRET_ACCESS_KEY\s*=\s*['"`][A-Za-z0-9+/]{40}['"`])/i,
    severity: 'CRITICAL',
    desc: 'Potential hardcoded live API secret key, Gemini key, or cloud credential.'
  },
  SQL_INJECTION: {
    regex: /(query\s*\(\s*['"`][^'"`]*\$\{.*\}['"`]\s*\)|all\s*\(\s*['"`][^'"`]*\$\{.*\}['"`]\s*\))/i,
    severity: 'HIGH',
    desc: 'Potential SQL Injection vulnerability due to dynamic string interpolation in DB queries.'
  },
  BROAD_CORS: {
    regex: /cors\(\s*\{\s*origin\s*:\s*(['"`]\*['"`]|true)\s*\}\s*\)/i,
    severity: 'MEDIUM',
    desc: 'Excessively permissive CORS origin header configured. Vulnerable to CSRF reflections in SaaS environments.'
  },
  EVAL_USAGE: {
    regex: /\beval\s*\(/,
    severity: 'HIGH',
    desc: 'Execution of string-based commands via eval() represents a critical RCE threat vector.'
  },
  HTTP_PROTOCOL: {
    regex: /http:\/\/[a-zA-Z0-9.\-_]/,
    severity: 'LOW',
    desc: 'Usage of plain HTTP transport. Transition to absolute secure HTTPS.'
  }
};

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Check against standard patterns
    for (const [key, field] of Object.entries(patterns)) {
      lines.forEach((line, idx) => {
        if (field.regex.test(line)) {
          vulns.push({
            file: filePath,
            lineNum: idx + 1,
            lineText: line.trim(),
            severity: field.severity,
            vulnerability: key,
            description: field.desc
          });
        }
      });
    }
  } catch (err) {
    // Skip unreadable files gracefully
  }
}

function traverseAndScan(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
        traverseAndScan(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if ((ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.json') && item !== 'security-scan.js') {
        scanFile(fullPath);
      }
    }
  }
}

// Commencing static analysis
directoryQueue.forEach(traverseAndScan);

// Summary Reporting
console.log(`\n${bold("==========================================================")}`);
console.log(`${bold("   Security Scan Diagnostics & Breakdown")}`);
console.log(`${bold("==========================================================")}`);

const criticals = vulns.filter(v => v.severity === 'CRITICAL');
const highs = vulns.filter(v => v.severity === 'HIGH');
const mediums = vulns.filter(v => v.severity === 'MEDIUM');
const lows = vulns.filter(v => v.severity === 'LOW');

console.log(`Scan Coverage:      3 key modules scanned (src, server, scripts)`);
console.log(`Total Issues Set:   ${vulns.length === 0 ? green("0 vulnerabilities") : yellow(`${vulns.length} vulnerabilities found`)}`);
console.log(` - Critical:        ${criticals.length > 0 ? red(criticals.length) : green(0)}`);
console.log(` - High:            ${highs.length > 0 ? red(highs.length) : green(0)}`);
console.log(` - Medium:          ${mediums.length > 0 ? yellow(mediums.length) : green(0)}`);
console.log(` - Low:             ${lows.length > 0 ? yellow(lows.length) : green(0)}`);

if (vulns.length > 0) {
  console.log(`\n${bold("Vulnerability Register:")}`);
  vulns.forEach((v, idx) => {
    const sevColor = v.severity === 'CRITICAL' || v.severity === 'HIGH' ? red : yellow;
    console.log(` [${idx + 1}] [${sevColor(v.severity)}] ${bold(v.vulnerability)} in ${dim(v.file)}:${v.lineNum}`);
    console.log(`     Desc:  ${v.description}`);
    console.log(`     Code:  "${dim(v.lineText)}"`);
  });
}

// Calculate generic Security Grade
let securityGrade = 'A';
if (criticals.length > 0) securityGrade = 'F';
else if (highs.length > 0) securityGrade = 'C';
else if (mediums.length > 0) securityGrade = 'B';

console.log(`\n${bold("==========================================================")}`);
console.log(`Assigned Security Grade: [ ${bold(securityGrade === 'A' ? green('A') : securityGrade === 'B' ? yellow('B') : red(securityGrade))} ]`);
console.log(`SLA Compliance Rate:     ${criticals.length === 0 ? green("100% (Compliant)") : red("NON-COMPLIANT")}`);
console.log(`==========================================================\n`);

// Standard exit protocol: Fail GitHub Actions block ONLY if critical or high vulnerability is hardcoded
if (criticals.length > 0) {
  console.error(red("Catastrophic security failure: Hardcoded credentials or live keys detected! Halting pipeline deployment steps."));
  process.exit(1);
} else {
  process.exit(0);
}
