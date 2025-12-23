# RTL Text Centering Issue - Help Needed

## Problem Description

I'm working on a Next.js website with bilingual support (English LTR and Hebrew RTL). I'm experiencing an issue where some sections display centered text correctly in RTL mode, while others display right-aligned text instead of centered.

## What Works (Centered Correctly)

The following sections correctly display centered text in RTL mode:

1. **Hero section** (`.hero`, `.hero-inner`) - Text is perfectly centered
2. **About hero section** (`.about-hero`, `.about-hero-content`) - Text is perfectly centered
3. **Privacy/Contact/Terms hero sections** - All centered correctly

These working sections use this pattern:
- Base CSS: `text-align: center;`
- RTL override: `[dir="rtl"] .hero { text-align: center; }` and `[dir="rtl"] .hero-inner { text-align: center; }`

## What Doesn't Work (Right-Aligned Instead of Centered)

The following sections display right-aligned text in RTL mode, even though they should be centered:

1. **About opening section** (`.about-opening`, `.about-opening-content`, `.about-opening-line`)
2. **Wonder section** (`.wonder-content`)
3. **Foundation section** (`.foundation-title`, `.foundation-body`)
4. **WhatIsInigo section** (`.what-is-inigo-title`, `.what-is-inigo-body`)

## Current CSS Structure

I have a general RTL rule that sets text-align:right on everything:
```css
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}
```

Then I have specific overrides for hero sections:
```css
[dir="rtl"] .about-hero,
[dir="rtl"] .privacy-hero,
[dir="rtl"] .contact-hero,
[dir="rtl"] .terms-hero,
[dir="rtl"] .hero,
[dir="rtl"] .about-opening {
  text-align: center !important;
}

[dir="rtl"] .about-hero-content,
[dir="rtl"] .privacy-hero-content,
[dir="rtl"] .contact-hero-content,
[dir="rtl"] .terms-hero-content,
[dir="rtl"] .hero-inner,
[dir="rtl"] .about-opening-content,
[dir="rtl"] .about-opening-content * {
  text-align: center !important;
}
```

## What I've Tried

1. Added `!important` flags to force centering
2. Used wildcard selectors (`*`) to target all children
3. Added `direction: ltr !important` to force LTR direction (didn't work)
4. Used flexbox with `justify-content: center` (didn't work)
5. Cleared Next.js cache and browser cache
6. Matched the exact pattern of working sections

## HTML Structure Example

The non-working About opening section:
```html
<section className="about-opening">
  <div className="about-container">
    <div className="about-opening-content">
      <p className="about-opening-line">היי.</p>
      <p className="about-opening-line">אנחנו איניגו.</p>
      <!-- etc -->
    </div>
  </div>
</section>
```

The working Hero section:
```html
<section className="hero">
  <div className="hero-inner">
    <h1>Headline</h1>
    <p>Content</p>
  </div>
</section>
```

## Question

Why do the hero sections center correctly in RTL, but the About opening section (and other new sections) don't, even when using the same CSS pattern? What's the difference between the working and non-working sections that causes this behavior?

Please help me identify:
1. What makes the hero sections work correctly
2. What's different about the new sections that prevents centering
3. How to fix the new sections to match the working pattern

