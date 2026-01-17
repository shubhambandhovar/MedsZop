# Dark Mode Testing & Verification Guide

## 🧪 Testing Instructions

### Prerequisites
- Frontend built successfully (run `npm run build`)
- Application running locally or deployed
- Browser with developer tools

---

## Manual Testing Checklist

### ✅ Test 1: Theme Toggle Visibility
**Objective**: Verify theme toggle appears in correct location

1. Open the application
2. Log in or navigate past login
3. Look at the top-right navbar
4. **Expected**: See Sun/Moon icon after Language toggle button
5. **Not Expected**: Theme toggle should NOT appear on Login/Register pages

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 2: Theme Toggle Functionality
**Objective**: Verify switching between light and dark modes

1. Click the Sun/Moon icon in navbar
2. **Expected**: Entire page switches to dark mode immediately
3. Click again
4. **Expected**: Page switches back to light mode
5. Theme should appear to switch smoothly without flashing

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 3: Dark Mode Colors Verification
**Objective**: Verify dark mode uses correct color palette

When in dark mode, check:
1. **Background**: Should be DARK SLATE, not pure black
   - Use DevTools to inspect: should be `#0f172a` or very close
   - Not: `#000000` (pure black)
   - ✅ Pass if: Dark but still clearly readable

2. **Text**: Should be LIGHT, with high contrast
   - Inspector should show: `#e2e8f0` or similar light gray
   - Not: Pure white unless for emphasis
   - ✅ Pass if: Text is easily readable

3. **Cards**: Should be MEDIUM SLATE
   - Inspector should show: `#1e293b`
   - Not: Same as background (should have elevation)
   - ✅ Pass if: Cards appear elevated/layered

4. **Accents**: Should be COLORED, not gray
   - Blue buttons: `#3b82f6`
   - Green accents: `#10b981`
   - ✅ Pass if: Accent colors are vibrant but not harsh

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 4: Light Mode Unchanged
**Objective**: Verify light mode was not affected

1. Ensure app is in LIGHT mode (toggle if needed)
2. Check each page:
   - [ ] HomePage
   - [ ] Medicine detail page
   - [ ] Cart page
   - [ ] Checkout page
   - [ ] User profile
   - [ ] Order tracking

3. **Expected**: Light mode looks exactly as before, no changes
4. White backgrounds, black text, same colors as always

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 5: Theme Persistence - Navigation
**Objective**: Verify theme persists when navigating

1. Switch to DARK mode
2. Navigate to different pages:
   - [ ] Go to home
   - [ ] View medicine detail
   - [ ] Go to cart
   - [ ] Check profile
3. **Expected**: All pages stay in DARK mode
4. Switch to LIGHT mode
5. Repeat navigation
6. **Expected**: All pages stay in LIGHT mode

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 6: Theme Persistence - Page Reload
**Objective**: Verify theme persists after refresh

1. Switch to DARK mode
2. Press F5 (or Cmd+R) to reload page
3. **Expected**: Page reloads in DARK mode
4. Switch to LIGHT mode
5. Reload page again
6. **Expected**: Page reloads in LIGHT mode

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 7: Login/Register Pages
**Objective**: Verify theme toggles removed from auth pages

1. Navigate to or log out to see login page
2. Look at top-right corner
3. **Expected**: NO theme toggle visible
4. Check all three register screens
5. **Expected**: NO theme toggle buttons anywhere
6. Dark mode should still apply to auth pages via global theme

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 8: Mobile Responsiveness
**Objective**: Verify dark mode works on mobile

1. Open DevTools (F12)
2. Switch to mobile view (Ctrl+Shift+M)
3. Check responsive sizes:
   - [ ] 375px (iPhone SE)
   - [ ] 768px (iPad)
   - [ ] 1024px (iPad Pro)
4. Toggle dark mode on each size
5. **Expected**: Dark mode applies correctly at all sizes
6. **Expected**: Theme toggle remains visible and functional

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 9: Text Contrast Verification
**Objective**: Verify WCAG AA accessibility compliance

In dark mode, check text readability:

1. **Main Text**: 
   - Against dark background
   - Should have contrast ratio ≥ 4.5:1
   
2. **Muted Text** (secondary):
   - Should still be readable
   - Contrast ratio ≥ 3:1
   
3. **Links**:
   - Should be visually distinct
   - Color blind friendly (not red-green only)

**Tools**:
- Chrome: Right-click → Inspect → click contrast ratio
- Firefox: Right-click → Inspect → Accessibility tab

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 10: Component-Specific Tests
**Objective**: Verify each component looks correct in dark mode

**HomePage**:
- [ ] Feature cards are visible with dark backgrounds
- [ ] Search bar is accessible
- [ ] Action buttons (Upload, Scan, Consultation) are distinct
- [ ] Popular medicines grid shows proper elevation

**Cart**:
- [ ] Cart items visible in dark mode
- [ ] Quantity controls accessible
- [ ] Total amount clearly visible
- [ ] Checkout button properly styled

**Checkout**:
- [ ] Form inputs have dark background
- [ ] Labels readable
- [ ] Buttons accessible
- [ ] Address list items visible

**Medicine Detail**:
- [ ] Product image visible
- [ ] Price clear and readable
- [ ] Add to cart button accessible
- [ ] Product info readable

**Order Tracking**:
- [ ] Status timeline visible
- [ ] Delivery info readable
- [ ] Map/location visible (if present)

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 11: System Preference
**Objective**: Verify system dark mode preference respected on first visit

1. **Clear localStorage**:
   - Open DevTools → Application → localStorage
   - Look for `theme` key, delete it if present

2. **Test Dark Preference**:
   - Windows: Settings → Personalization → Colors → Dark
   - Mac: System Prefs → General → Appearance → Dark
   - Browser will respect this

3. **Reload page**:
   - **Expected**: If system is dark, page loads in dark mode
   - **Expected**: If system is light, page loads in light mode

4. **Manual Toggle**:
   - Click theme toggle
   - **Expected**: Preference saved to localStorage
   - **Expected**: Future reloads remember your choice, not system preference

**Result**: [ ] Pass [ ] Fail

---

### ✅ Test 12: Browser Compatibility
**Objective**: Verify dark mode works across browsers

Test on:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Expected: Dark mode toggle and styling works identically

**Result**: [ ] Pass [ ] Fail

---

## 🔍 Developer Testing

### Check Theme Variables
Open DevTools Console and run:
```javascript
// Check if dark class is applied
document.documentElement.classList.contains('dark')  // Should be true/false

// Check localStorage
localStorage.getItem('theme')  // Should be 'light', 'dark', or 'system'

// Check computed styles in dark mode
getComputedStyle(document.documentElement).getPropertyValue('--background')
// Should return dark color value
```

### Check CSS Variables
In DevTools Styles tab:
1. Inspect any element
2. Look at Computed tab
3. Should show CSS variables with values:
   - `--background`: dark color in dark mode
   - `--foreground`: light color in dark mode
   - `--card`: medium dark in dark mode

### Monitor Console for Errors
```
- [ ] No JavaScript errors
- [ ] No CSS warnings
- [ ] No console logs about theme issues
```

---

## 📋 Accessibility Testing

### Test with Screen Reader
- [ ] Theme toggle has proper aria-label
- [ ] Theme change announced to screen reader
- [ ] All links and buttons accessible

### Test with Keyboard
- [ ] Tab to theme toggle
- [ ] Space/Enter activates toggle
- [ ] Visible focus indicator on toggle

### Test Color Contrast
Use online tool: https://www.tota11y.com/
- [ ] All text meets WCAG AA (4.5:1 for normal text)
- [ ] All UI components accessible

---

## 🐛 Troubleshooting

### Issue: Dark mode not applying
**Solution**:
1. Check if ThemeProvider wraps App in main.tsx
2. Clear browser cache (Ctrl+Shift+Delete)
3. Clear localStorage: `localStorage.clear()`
4. Hard refresh: Ctrl+Shift+R
5. Check browser console for errors

### Issue: Theme toggle not visible
**Solution**:
1. Verify Header component imports ThemeToggle
2. Check that Header is rendered on the page
3. Verify it's not hidden by CSS (z-index issues)
4. Check that you're logged in (shouldn't appear on login page)

### Issue: Theme doesn't persist
**Solution**:
1. Check browser localStorage is enabled
2. Check localStorage has `theme` key: `localStorage.getItem('theme')`
3. Verify ThemeProvider's useEffect hook is running
4. Check browser console for localStorage errors

### Issue: Colors look wrong
**Solution**:
1. Compare hex colors with expected values in theme.css
2. Check that Tailwind `dark:` prefix is applied correctly
3. Check for conflicting CSS rules
4. Verify CSS variables are defined

---

## ✅ Sign-Off Checklist

**Before declaring completion:**

- [ ] All 12 manual tests pass
- [ ] No console errors
- [ ] Light mode unchanged
- [ ] Dark mode professional (not harsh)
- [ ] Text readable and accessible
- [ ] Theme toggle visible on all pages except auth
- [ ] Theme persists on reload and navigation
- [ ] Mobile responsive
- [ ] Works in all major browsers
- [ ] Keyboard accessible
- [ ] Screen reader compatible
- [ ] Build completes without errors

**Total Tests**: 12  
**Tests Passed**: ___  
**Tests Failed**: ___  

**Status**: [ ] Ready for Production [ ] Needs Fixes

---

## 📝 Test Results Log

Date: _______________  
Tester: _______________  
Browser: _______________  
OS: _______________  

| Test # | Test Name | Result | Notes |
|--------|-----------|--------|-------|
| 1 | Theme Toggle Visibility | [ ] | |
| 2 | Toggle Functionality | [ ] | |
| 3 | Color Verification | [ ] | |
| 4 | Light Mode Unchanged | [ ] | |
| 5 | Persistence - Navigation | [ ] | |
| 6 | Persistence - Reload | [ ] | |
| 7 | Auth Pages No Toggle | [ ] | |
| 8 | Mobile Responsive | [ ] | |
| 9 | Text Contrast | [ ] | |
| 10 | Components | [ ] | |
| 11 | System Preference | [ ] | |
| 12 | Browser Compatibility | [ ] | |

---

## 🎉 Verification Complete

Once all tests pass, dark mode implementation is verified and ready for production!
