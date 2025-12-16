# Share OG Images

This directory contains Open Graph images for share pages.

## Files

### Type-Specific Images

- **`spot.jpg`** - OG image for spot shares
  - URL: `https://inigo.now/static/share/spot.jpg`
  - Dimensions: 1200×630
  - Format: JPG (baseline, WhatsApp-safe)
  - Size: < 500KB

- **`session.jpg`** - OG image for session shares
  - URL: `https://inigo.now/static/share/session.jpg`
  - Dimensions: 1200×630
  - Format: JPG (baseline, WhatsApp-safe)
  - Size: < 500KB

- **`event.jpg`** - OG image for event shares
  - URL: `https://inigo.now/static/share/event.jpg`
  - Dimensions: 1200×630
  - Format: JPG (baseline, WhatsApp-safe)
  - Size: < 500KB

### Fallback Image

- **`default.jpg`** - Default OG image fallback
  - URL: `https://inigo.now/static/share/default.jpg`
  - Dimensions: 1200×630
  - Format: JPG
  - Size: < 2MB
  - Used when share pages don't have specific OG images

## Requirements

All images must be:
- **Dimensions:** 1200×630 pixels (recommended for OG images)
- **Format:** JPG (baseline encoding for WhatsApp compatibility)
- **Size:** < 500KB for type-specific images, < 2MB for default
- **Publicly accessible:** No auth, no redirects
- **Content-Type:** `image/jpeg` (automatically set by Next.js/Vercel)

## Verification

After deployment, verify all images are accessible:

```bash
curl -I https://inigo.now/static/share/spot.jpg
curl -I https://inigo.now/static/share/session.jpg
curl -I https://inigo.now/static/share/event.jpg
curl -I https://inigo.now/static/share/default.jpg
```

**Expected for all:**
- `HTTP/2 200`
- `content-type: image/jpeg`
- No redirect `Location` header

