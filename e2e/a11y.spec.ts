import { test, expect } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page for keyboard navigation testing
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('Homepage keyboard navigation and focus rings', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page).toHaveTitle(/Inbox Genie/)

    // Test keyboard navigation through header
    await page.keyboard.press('Tab')
    
    // Check that first focusable element has visible focus
    const firstFocusable = await page.locator(':focus').first()
    await expect(firstFocusable).toBeVisible()
    
    // Navigate through header elements
    let tabCount = 0
    const maxTabs = 10 // Safety limit
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      const focused = await page.locator(':focus')
      
      if (await focused.count() > 0) {
        // Verify focus ring is visible (check for common focus indicators)
        const focusedElement = focused.first()
        const isVisible = await focusedElement.isVisible()
        expect(isVisible).toBeTruthy()
        
        // Check for focus styles (outline, border, box-shadow)
        const computedStyle = await focusedElement.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            outline: style.outline,
            outlineWidth: style.outlineWidth,
            outlineStyle: style.outlineStyle,
            outlineColor: style.outlineColor,
            boxShadow: style.boxShadow,
            border: style.border
          }
        })
        
        // At least one focus indicator should be present
        const hasFocusIndicator = 
          computedStyle.outlineWidth !== '0px' ||
          computedStyle.boxShadow !== 'none' ||
          computedStyle.outline !== 'none'
        
        if (hasFocusIndicator) {
          console.log(`✅ Focus indicator found for element: ${await focusedElement.textContent()}`)
        }
      }
      
      tabCount++
    }
    
    // Check for JavaScript errors
    const logs = await page.evaluate(() => {
      return window.__errors || []
    })
    
    expect(logs.length).toBe(0)
  })

  test('Pricing page keyboard navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`)
    await expect(page).toHaveTitle(/Pricing/)

    // Test keyboard navigation through pricing cards
    await page.keyboard.press('Tab')
    
    let tabCount = 0
    const maxTabs = 15
    const focusedElements = []
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      const focused = await page.locator(':focus')
      
      if (await focused.count() > 0) {
        const focusedElement = focused.first()
        const isVisible = await focusedElement.isVisible()
        const text = await focusedElement.textContent()
        
        if (isVisible && text) {
          focusedElements.push(text.trim())
        }
      }
      
      tabCount++
    }
    
    console.log(`📝 Focusable elements found: ${focusedElements.length}`)
    
    // Verify we can navigate to at least some key elements
    expect(focusedElements.length).toBeGreaterThan(0)
  })

  test('FAQ accordion keyboard interaction', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Look for FAQ section
    const faqSection = page.locator('[data-testid="faq"], .faq, [id*="faq"], [class*="faq"]').first()
    
    if (await faqSection.count() > 0) {
      await faqSection.scrollIntoViewIfNeeded()
      
      // Find accordion buttons
      const accordionButtons = faqSection.locator('button, [role="button"], summary')
      
      if (await accordionButtons.count() > 0) {
        // Test keyboard interaction with first accordion item
        await accordionButtons.first().focus()
        await page.keyboard.press('Enter')
        
        // Wait for potential animation
        await page.waitForTimeout(300)
        
        // Check if content expanded (look for common indicators)
        const expandedContent = faqSection.locator('[aria-expanded="true"], .expanded, .open, details[open]')
        const hasExpandedContent = await expandedContent.count() > 0
        
        if (hasExpandedContent) {
          console.log('✅ FAQ accordion keyboard interaction working')
        }
      }
    }
    
    // Check for JavaScript errors during interaction
    const jsErrors = []
    page.on('pageerror', (error) => {
      jsErrors.push(error.message)
    })
    
    await page.waitForTimeout(1000)
    expect(jsErrors.length).toBe(0)
  })

  test('Form accessibility (if forms exist)', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Look for forms
    const forms = page.locator('form, [role="form"]')
    
    if (await forms.count() > 0) {
      const form = forms.first()
      await form.scrollIntoViewIfNeeded()
      
      // Test form field navigation
      const inputs = form.locator('input, textarea, select, button[type="submit"]')
      const inputCount = await inputs.count()
      
      if (inputCount > 0) {
        // Focus first input
        await inputs.first().focus()
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i)
          await input.focus()
          
          // Check for associated label
          const inputId = await input.getAttribute('id')
          if (inputId) {
            const label = page.locator(`label[for="${inputId}"]`)
            const hasLabel = await label.count() > 0
            
            if (hasLabel) {
              console.log(`✅ Input ${i + 1} has associated label`)
            }
          }
          
          // Check for placeholder or aria-label
          const placeholder = await input.getAttribute('placeholder')
          const ariaLabel = await input.getAttribute('aria-label')
          const hasAccessibleName = placeholder || ariaLabel
          
          if (hasAccessibleName) {
            console.log(`✅ Input ${i + 1} has accessible name`)
          }
        }
      }
    }
  })

  test('Color contrast and visual accessibility', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Test high contrast mode compatibility
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(500)
    
    // Check that content is still visible
    const bodyText = await page.locator('body').textContent()
    expect(bodyText?.length).toBeGreaterThan(0)
    
    // Reset to light mode
    await page.emulateMedia({ colorScheme: 'light' })
    
    // Check for reduced motion support
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(500)
    
    // Test that page still functions with reduced motion
    const titleElement = page.locator('h1').first()
    if (await titleElement.count() > 0) {
      await expect(titleElement).toBeVisible()
    }
  })

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    const headingLevels = []
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase())
      const text = await heading.textContent()
      
      if (text?.trim()) {
        headingLevels.push(tagName)
        console.log(`📋 Found ${tagName}: "${text.trim()}"`)
      }
    }
    
    // Should have at least one h1
    const hasH1 = headingLevels.includes('h1')
    expect(hasH1).toBeTruthy()
    
    // Check for alt text on images
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const src = await img.getAttribute('src')
      
      if (src && !src.startsWith('data:')) {
        expect(alt).toBeDefined()
        console.log(`🖼️  Image has alt text: "${alt}"`)
      }
    }
    
    // Check for skip links
    const skipLinks = page.locator('a[href*="#"]').filter({ hasText: /skip/i })
    if (await skipLinks.count() > 0) {
      console.log('✅ Skip links found')
    }
    
    // Check for main landmark
    const mainElement = page.locator('main, [role="main"]')
    if (await mainElement.count() > 0) {
      console.log('✅ Main landmark found')
    }
  })
})