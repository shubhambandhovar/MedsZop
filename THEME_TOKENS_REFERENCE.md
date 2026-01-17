# Theme Tokens Quick Reference

## 🎨 Available CSS Variables

### Core Colors

| Light Mode | Dark Mode | Variable Name | Usage |
|-----------|-----------|---------------|-------|
| #ffffff | #0f172a | `--color-bg-primary` | Main background |
| #f8fafc | #1e293b | `--color-bg-secondary` | Secondary background |
| #ececf0 | #334155 | `--color-bg-tertiary` | Tertiary background |
| #030213 | #f1f5f9 | `--color-text-primary` | Main text |
| #717182 | #cbd5e1 | `--color-text-secondary` | Secondary text |
| #94a3b8 | #94a3b8 | `--color-text-muted` | Muted text |

### Surfaces

| Variable | Light | Dark | Purpose |
|----------|-------|------|---------|
| `--color-surface` | #ffffff | #1e293b | Cards, containers |
| `--color-surface-hover` | #f3f3f5 | #334155 | Hover state |
| `--color-surface-active` | #ececf0 | #475569 | Active state |

### Semantic Colors

#### Primary (Blue)
```css
--color-primary: #0369a1 (light) / #3b82f6 (dark)
--color-primary-light: #0284c7 (light) / #60a5fa (dark)
--color-primary-dark: #075985 (light) / #1e40af (dark)
```

#### Success (Green)
```css
--color-success: #10b981
--color-success-light: #22c55e
--color-success-dark: #059669
```

#### Warning (Amber)
```css
--color-warning: #f59e0b (light) / #fbbf24 (dark)
```

#### Error (Red)
```css
--color-error: #d4183d (light) / #f87171 (dark)
```

### Form Elements

| Variable | Light | Dark | Purpose |
|----------|-------|------|---------|
| `--color-input-bg` | #f3f3f5 | #1e293b | Input background |
| `--color-input-border` | rgba(0,0,0,0.1) | #334155 | Input border |
| `--color-input-focus` | #0369a1 | #3b82f6 | Focus color |

### Borders

| Variable | Light | Dark | Purpose |
|----------|-------|------|---------|
| `--color-border` | rgba(0,0,0,0.1) | #334155 | Default border |
| `--color-border-light` | #ececf0 | #475569 | Light border |
| `--color-border-medium` | #cbd5e1 | #64748b | Medium border |
| `--color-border-dark` | #94a3b8 | #475569 | Dark border |

### Gray Scale

```css
--color-gray-50:   #f9fafb (light)  / #f9fafb (dark)
--color-gray-100:  #f3f3f5 (light)  / #1e293b (dark)
--color-gray-200:  #ececf0 (light)  / #334155 (dark)
--color-gray-300:  #cbd5e1 (light)  / #475569 (dark)
--color-gray-400:  #94a3b8 (light)  / #64748b (dark)
--color-gray-500:  #717182 (light)  / #94a3b8 (dark)
--color-gray-600:  #4a5568 (light)  / #cbd5e1 (dark)
--color-gray-700:  #2d3748 (light)  / #e2e8f0 (dark)
--color-gray-800:  #1a202c (light)  / #f1f5f9 (dark)
--color-gray-900:  #030213 (light)  / #ffffff (dark)
```

### Health/Medical Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-health-blue` | #0369a1 (light) / #3b82f6 (dark) | Primary health color |
| `--color-health-blue-light` | #e0f2fe (light) / #1e40af (dark) | Light health blue |
| `--color-health-green` | #10b981 | Success/healthy state |
| `--color-health-green-light` | #d1fae5 (light) / #047857 (dark) | Light health green |
| `--color-health-amber` | #f59e0b (light) / #fbbf24 (dark) | Warning/caution |

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05|0.5)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1|0.4)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1|0.3)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1|0.2)
```

### Radius

```css
--radius-base: 0.625rem
--radius-sm: calc(var(--radius-base) - 4px)    /* 0.125rem */
--radius-md: calc(var(--radius-base) - 2px)    /* 0.375rem */
--radius-lg: var(--radius-base)                /* 0.625rem */
--radius-xl: calc(var(--radius-base) + 4px)    /* 1.025rem */
```

### Transitions

```css
--transition-fast: 0.15s
--transition-normal: 0.2s
--transition-slow: 0.3s
```

### Font Weights

```css
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

---

## 💻 Usage Examples

### Basic Component Styling

```css
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: background-color var(--transition-normal);
}

.card:hover {
  background-color: var(--color-surface-hover);
}
```

### Input Field

```css
.input {
  background-color: var(--color-input-bg);
  border: 1px solid var(--color-input-border);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
}

.input:focus {
  border-color: var(--color-input-focus);
  outline: none;
}

.input::placeholder {
  color: var(--color-text-muted);
}
```

### Button

```css
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-normal);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-primary:focus {
  box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1);
}
```

### Text Colors

```css
.text-primary {
  color: var(--color-text-primary);
}

.text-secondary {
  color: var(--color-text-secondary);
}

.text-muted {
  color: var(--color-text-muted);
}

.text-success {
  color: var(--color-success);
}

.text-error {
  color: var(--color-error);
}
```

### Backgrounds

```css
.bg-primary {
  background-color: var(--color-primary);
}

.bg-surface {
  background-color: var(--color-surface);
}

.bg-muted {
  background-color: var(--color-bg-tertiary);
}
```

### Borders

```css
.border {
  border-color: var(--color-border);
}

.border-primary {
  border-color: var(--color-primary);
}

.border-success {
  border-color: var(--color-success);
}
```

---

## 🎯 Common Patterns

### Accessible Text + Background

```css
.alert-success {
  background-color: var(--color-success);
  color: white; /* High contrast */
  border: 1px solid var(--color-success-dark);
  border-radius: var(--radius-md);
  padding: 12px 16px;
}
```

### Form Group

```css
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  margin-bottom: 4px;
}

.form-group input {
  background-color: var(--color-input-bg);
  border: 1px solid var(--color-input-border);
  color: var(--color-text-primary);
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
}
```

### Card with Elevation

```css
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 16px;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  background-color: var(--color-surface-hover);
}
```

### Disabled State

```css
.btn:disabled {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.5;
}
```

### Link Colors

```css
a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-normal);
}

a:hover {
  color: var(--color-primary-light);
}

a:visited {
  color: var(--color-primary-dark);
}
```

---

## 🔄 Converting Old Hard-Coded Colors

### Before (Hard-coded)
```css
.component {
  background-color: #ffffff;
  color: #030213;
  border-color: rgba(0, 0, 0, 0.1);
}

.dark .component {
  background-color: #1e293b;
  color: #e2e8f0;
  border-color: #334155;
}
```

### After (Using Variables)
```css
.component {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}
/* Dark mode automatically applied! */
```

---

## 📝 Adding New Tokens

1. **Determine if it's semantic or component-specific**
   - Semantic → Add to `theme-tokens.css` with `--color-*` prefix
   - Component → Use existing tokens

2. **Add to light mode** (`:root`)
3. **Add dark override** (`.dark`)
4. **Document** with comments

Example:
```css
/* In theme-tokens.css */
:root {
  --color-custom-special: #your-light-color;
}

.dark {
  --color-custom-special: #your-dark-color;
}
```

4. **Use in components**:
```css
.special-component {
  background-color: var(--color-custom-special);
}
```

---

## ✨ Best Practices

1. ✅ Use `--color-*` variables instead of hardcoded hex
2. ✅ Use `var(--shadow-*)` for consistency
3. ✅ Use `var(--radius-*)` for consistent corners
4. ✅ Use `var(--transition-*)` for smooth animations
5. ✅ Avoid hardcoding dark mode colors
6. ✅ Test both light and dark modes
7. ✅ Use semantic color names when possible
8. ✅ Keep component-specific styles minimal
9. ✅ Leverage utility patterns from `theme-utilities.css`
10. ✅ Check contrast ratios for accessibility

---

## 🐛 Debugging

### Check Applied Token
```javascript
// In browser console
const computed = getComputedStyle(document.documentElement);
computed.getPropertyValue('--color-primary').trim();
// Output: "#0369a1" (light) or "#3b82f6" (dark)
```

### Check If Dark Mode Active
```javascript
document.documentElement.classList.contains('dark')
// true = dark mode, false = light mode
```

### Force Refresh Tokens
```javascript
// Clear cache and reload
localStorage.setItem('theme', 'dark');
location.reload();
```

---

## 📚 Related Files

- **Definitions**: [theme-tokens.css](./Frontend/src/styles/theme-tokens.css)
- **Utilities**: [theme-utilities.css](./Frontend/src/styles/theme-utilities.css)
- **Context**: [ThemeContext.tsx](./Frontend/src/app/contexts/ThemeContext.tsx)
- **Guide**: [THEME_REFACTORING_GUIDE.md](./THEME_REFACTORING_GUIDE.md)
