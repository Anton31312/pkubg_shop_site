# Pkubg E-commerce Design System

## Overview

This design system implements a modern, accessible, and responsive interface with calm tones for the Pkubg e-commerce platform. The system is built with performance and user experience in mind.

## Design Principles

### 1. Calm and Soothing Aesthetics
- **Color Palette**: Soft greens and warm grays create a calming atmosphere
- **Typography**: Clean, readable fonts with appropriate spacing
- **Visual Hierarchy**: Clear information architecture with subtle emphasis

### 2. Responsive Design
- **Mobile-First**: Designed for mobile devices and scaled up
- **Flexible Layouts**: CSS Grid and Flexbox for adaptive layouts
- **Touch-Friendly**: Minimum 44px touch targets, 48px on mobile

### 3. Performance Optimization
- **Efficient CSS**: Minimal, optimized stylesheets
- **Hardware Acceleration**: GPU-accelerated animations
- **Reduced Motion**: Respects user preferences for reduced motion

### 4. Accessibility
- **High Contrast**: Meets WCAG contrast requirements
- **Focus Management**: Clear focus indicators
- **Screen Reader Support**: Semantic HTML and ARIA labels

## File Structure

```
src/styles/
├── theme.css          # Design tokens and CSS variables
├── animations.css     # Animation utilities and keyframes
├── responsive.css     # Responsive utilities and breakpoints
└── README.md         # This documentation
```

## Theme System

### Color Palette

#### Primary Colors (Calm Greens)
- `--color-primary-50`: #f0f9f0 (Lightest)
- `--color-primary-500`: #2c5530 (Main brand color)
- `--color-primary-600`: #1e3a21 (Hover states)
- `--color-primary-900`: #0a140b (Darkest)

#### Neutral Colors (Warm Grays)
- `--color-neutral-50`: #fafafa (Background)
- `--color-neutral-500`: #737373 (Text secondary)
- `--color-neutral-900`: #171717 (Text primary)

#### Semantic Colors
- **Success**: Green tones for positive actions
- **Warning**: Amber tones for caution
- **Error**: Red tones for errors
- **Info**: Blue tones for information

### Typography

#### Font Families
- **Primary**: Inter (with system font fallbacks)
- **Monospace**: SF Mono, Monaco, Cascadia Code

#### Font Sizes
- `--font-size-xs`: 0.75rem (12px)
- `--font-size-base`: 1rem (16px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-5xl`: 3rem (48px)

#### Font Weights
- `--font-weight-normal`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700

### Spacing System

Based on 0.25rem (4px) increments:
- `--spacing-1`: 0.25rem (4px)
- `--spacing-4`: 1rem (16px)
- `--spacing-8`: 2rem (32px)
- `--spacing-16`: 4rem (64px)

### Border Radius

- `--radius-sm`: 0.125rem (2px)
- `--radius-base`: 0.25rem (4px)
- `--radius-lg`: 0.5rem (8px)
- `--radius-2xl`: 1rem (16px)
- `--radius-full`: 9999px (Fully rounded)

### Shadows

- `--shadow-sm`: Subtle shadow for cards
- `--shadow-md`: Medium shadow for elevated elements
- `--shadow-lg`: Large shadow for modals
- `--shadow-xl`: Extra large shadow for floating elements

## Component Styling

### Buttons

#### Primary Button
```css
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border-radius: var(--radius-2xl);
  padding: var(--spacing-3) var(--spacing-6);
  transition: var(--transition-base);
}
```

#### Features
- Gradient backgrounds for visual appeal
- Hover animations with transform and shadow
- Focus states for accessibility
- Disabled states with reduced opacity

### Cards

#### Product Cards
```css
.product-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-md);
  transition: var(--transition-base);
}
```

#### Features
- Glass morphism effect with backdrop blur
- Hover animations with lift and scale
- Responsive image containers
- Flexible content areas

### Forms

#### Input Fields
```css
.form-input {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid transparent;
  border-radius: var(--radius-2xl);
  padding: var(--spacing-4) var(--spacing-6);
  transition: var(--transition-base);
}
```

#### Features
- Focus states with border color change
- Smooth transitions
- Touch-friendly sizing
- Error and success states

## Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Responsive Utilities

#### Grid Systems
```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: clamp(1rem, 3vw, 2.5rem);
}
```

#### Typography
```css
.responsive-heading {
  font-size: clamp(1.5rem, 4vw, 3rem);
}
```

#### Visibility
- `.hide-mobile`: Hidden on mobile devices
- `.show-mobile`: Visible only on mobile
- `.touch-target`: Ensures minimum touch target size

### Mobile Optimizations

1. **Touch Targets**: Minimum 44px, 48px on mobile
2. **Readable Text**: Minimum 16px font size
3. **Thumb-Friendly**: Important actions within thumb reach
4. **Fast Loading**: Optimized images and minimal CSS

## Animations

### Performance Considerations

1. **GPU Acceleration**: Uses `transform` and `opacity`
2. **Reduced Motion**: Respects user preferences
3. **Efficient Keyframes**: Minimal repaints and reflows

### Animation Types

#### Micro-interactions
- Button hover effects
- Card lift animations
- Focus indicators

#### Page Transitions
- Fade in/out effects
- Slide animations
- Stagger animations for lists

#### Loading States
- Skeleton screens
- Spinner animations
- Progressive loading

### Example Animations

```css
/* Hover lift effect */
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Stagger animation for lists */
.stagger-item {
  animation: staggerIn 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}
```

## Performance Optimizations

### CSS Optimizations

1. **Critical CSS**: Inline critical styles
2. **CSS Variables**: Efficient theme switching
3. **Minimal Selectors**: Avoid deep nesting
4. **Hardware Acceleration**: Use `transform3d()`

### Loading Strategies

1. **Lazy Loading**: Images load when needed
2. **Resource Hints**: DNS prefetch and preconnect
3. **Font Loading**: Optimized web font loading
4. **Image Optimization**: WebP format with fallbacks

### Performance Utilities

```javascript
// Debounced scroll handler
const debouncedScroll = debounce(handleScroll, 16);

// Lazy load images
lazyLoadImages('img[data-src]');

// Measure performance
measurePerformance('component-render', renderComponent);
```

## Accessibility Features

### Color and Contrast

- **WCAG AA Compliance**: 4.5:1 contrast ratio minimum
- **High Contrast Mode**: Enhanced contrast for accessibility
- **Color Independence**: Information not conveyed by color alone

### Focus Management

- **Visible Focus**: Clear focus indicators
- **Logical Tab Order**: Proper keyboard navigation
- **Skip Links**: Quick navigation for screen readers

### Screen Reader Support

- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Descriptive labels for interactive elements
- **Live Regions**: Dynamic content announcements

## Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Progressive Enhancement
- **CSS Grid**: Fallback to Flexbox
- **CSS Variables**: Fallback values provided
- **Modern Features**: Graceful degradation

### Feature Detection

```css
/* CSS Grid with Flexbox fallback */
.grid-container {
  display: flex;
  flex-wrap: wrap;
}

@supports (display: grid) {
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
```

## Usage Guidelines

### Component Development

1. **Use Design Tokens**: Always use CSS variables
2. **Follow Naming**: Use BEM methodology
3. **Mobile First**: Start with mobile styles
4. **Test Accessibility**: Use screen readers and keyboard navigation

### Performance Best Practices

1. **Minimize Reflows**: Batch DOM updates
2. **Optimize Images**: Use appropriate formats and sizes
3. **Lazy Load**: Load content when needed
4. **Monitor Metrics**: Track Core Web Vitals

### Maintenance

1. **Regular Audits**: Check for unused CSS
2. **Performance Testing**: Monitor loading times
3. **Accessibility Testing**: Regular a11y audits
4. **Browser Testing**: Test across supported browsers

## Future Enhancements

### Planned Features

1. **Dark Mode**: Complete dark theme implementation
2. **Animation Library**: Extended animation utilities
3. **Component Library**: Reusable component system
4. **Design Tokens**: Enhanced token system

### Considerations

1. **CSS-in-JS**: Potential migration path
2. **Design System**: Expanded component library
3. **Theming**: Advanced customization options
4. **Performance**: Continued optimization efforts