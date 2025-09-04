import { execSync } from 'node:child_process'
import { writeFileSync } from 'fs'

// Configuration
const WEB_BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'
const THRESHOLDS = {
  performance: 95,
  accessibility: 95,
  'best-practices': 95,
  seo: 95,
  cls: 0.05
}

// Color utilities
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`
}

const urls = [`${WEB_BASE_URL}/`, `${WEB_BASE_URL}/pricing`]
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: WEB_BASE_URL,
  pages: [],
  summary: { passed: 0, failed: 0, warnings: 0 }
}

console.log(colors.bold('🚢 Lighthouse Performance Audit'))
console.log('='.repeat(50))
console.log(`${colors.dim('Base URL:')} ${WEB_BASE_URL}`)

// Check if web server is running
try {
  const response = await fetch(`${WEB_BASE_URL}/`, { 
    method: 'HEAD',
    signal: AbortSignal.timeout(5000)
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  console.log(`${colors.green('✅ Web server is accessible')}`)
} catch (error) {
  console.error(`${colors.red('❌ Web server not accessible:')} ${error.message}`)
  console.error(`${colors.yellow('💡 Make sure to run:')} pnpm --filter @inbox-genie/web dev`)
  process.exit(1)
}

for (const url of urls) {
  const pageName = url.endsWith('/') ? 'Homepage' : url.split('/').pop()
  console.log(`\n${colors.bold('🔍 Auditing:')} ${pageName}`)
  console.log(`${colors.dim('URL:')} ${url}`)
  console.log('─'.repeat(50))
  
  try {
    const json = execSync(`npx lighthouse '${url}' --quiet --chrome-flags='--headless=new' --preset=desktop --output=json --output-path=stdout`, { 
      stdio: ['ignore', 'pipe', 'inherit'],
      timeout: 60000
    }).toString()
    
    const report = JSON.parse(json)
    const scores = {
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      seo: Math.round(report.categories.seo.score * 100),
      'best-practices': Math.round(report.categories['best-practices'].score * 100)
    }
    
    // Get CLS value
    const clsAudit = report.audits['cumulative-layout-shift']
    const cls = clsAudit ? clsAudit.numericValue || 0 : 0
    
    // Get Core Web Vitals
    const fcp = report.audits['first-contentful-paint']?.numericValue || 0
    const lcp = report.audits['largest-contentful-paint']?.numericValue || 0
    const tbt = report.audits['total-blocking-time']?.numericValue || 0
    const si = report.audits['speed-index']?.numericValue || 0
    
    const pageResult = {
      name: pageName,
      url,
      scores,
      metrics: {
        cls: { value: cls, threshold: THRESHOLDS.cls },
        fcp: Math.round(fcp),
        lcp: Math.round(lcp),
        tbt: Math.round(tbt),
        speedIndex: Math.round(si)
      },
      passed: true,
      warnings: [],
      errors: []
    }
    
    // Evaluate scores
    for (const [category, score] of Object.entries(scores)) {
      const threshold = THRESHOLDS[category]
      const statusIcon = score >= threshold ? '✅' : score >= threshold - 10 ? '⚠️' : '❌'
      const color = score >= threshold ? colors.green : score >= threshold - 10 ? colors.yellow : colors.red
      
      console.log(`${statusIcon} ${colors.bold(category.toUpperCase())}: ${color(score + '%')} (threshold: ${threshold}%)`)
      
      if (score < threshold) {
        pageResult.passed = false
        pageResult.errors.push(`${category} score ${score}% below threshold ${threshold}%`)
      } else if (score < threshold + 5) {
        pageResult.warnings.push(`${category} score ${score}% close to threshold ${threshold}%`)
      }
    }
    
    // Evaluate CLS
    console.log(`\n${colors.bold('Core Web Vitals:')}`)
    const clsStatus = cls <= THRESHOLDS.cls ? '✅' : cls <= THRESHOLDS.cls * 2 ? '⚠️' : '❌'
    const clsColor = cls <= THRESHOLDS.cls ? colors.green : cls <= THRESHOLDS.cls * 2 ? colors.yellow : colors.red
    console.log(`${clsStatus} ${colors.bold('CLS')}: ${clsColor(cls.toFixed(3))} (threshold: ≤${THRESHOLDS.cls})`)
    
    if (cls > THRESHOLDS.cls) {
      if (cls > THRESHOLDS.cls * 2) {
        pageResult.passed = false
        pageResult.errors.push(`CLS ${cls.toFixed(3)} above threshold ${THRESHOLDS.cls}`)
      } else {
        pageResult.warnings.push(`CLS ${cls.toFixed(3)} approaching threshold ${THRESHOLDS.cls}`)
      }
    }
    
    // Show other metrics
    console.log(`ℹ️  ${colors.bold('FCP')}: ${Math.round(fcp)}ms`)
    console.log(`ℹ️  ${colors.bold('LCP')}: ${Math.round(lcp)}ms`)
    console.log(`ℹ️  ${colors.bold('TBT')}: ${Math.round(tbt)}ms`)
    console.log(`ℹ️  ${colors.bold('Speed Index')}: ${Math.round(si)}ms`)
    
    // Page summary
    if (pageResult.passed) {
      console.log(`\n${colors.green('✅ Page passed all thresholds')}`)
      results.summary.passed++
    } else {
      console.log(`\n${colors.red('❌ Page failed some thresholds')}`)
      pageResult.errors.forEach(error => console.log(`   • ${colors.red(error)}`))
      results.summary.failed++
    }
    
    if (pageResult.warnings.length > 0) {
      console.log(`${colors.yellow('⚠️  Warnings:')}`)
      pageResult.warnings.forEach(warning => console.log(`   • ${colors.yellow(warning)}`))
      results.summary.warnings += pageResult.warnings.length
    }
    
    results.pages.push(pageResult)
    
  } catch (error) {
    console.error(`${colors.red('❌ Audit failed:')} ${error.message}`)
    results.pages.push({
      name: pageName,
      url,
      passed: false,
      error: error.message
    })
    results.summary.failed++
  }
}

// Print summary
console.log(`\n${colors.bold('📊 Audit Summary')}`)
console.log('='.repeat(50))
console.log(`${colors.green('✅ Passed:')} ${results.summary.passed}/${urls.length} pages`)
console.log(`${colors.red('❌ Failed:')} ${results.summary.failed}/${urls.length} pages`)
console.log(`${colors.yellow('⚠️  Warnings:')} ${results.summary.warnings}`)

const score = urls.length > 0 ? Math.round((results.summary.passed / urls.length) * 100) : 0
console.log(`${colors.bold('Overall Score:')} ${score}%`)

if (results.summary.failed === 0 && results.summary.warnings === 0) {
  console.log(`\n${colors.green('🎉 All pages meet performance standards!')}\n`)
} else if (results.summary.failed === 0) {
  console.log(`\n${colors.yellow('⚠️  All pages passed but with warnings')}\n`)
} else {
  console.log(`\n${colors.red('❌ Some pages failed performance standards')}\n`)
}

// Save results
writeFileSync('lighthouse-results.json', JSON.stringify(results, null, 2))
console.log(colors.dim('Results saved to: lighthouse-results.json'))

// Exit with error if any page failed
if (results.summary.failed > 0) {
  process.exit(1)
}

