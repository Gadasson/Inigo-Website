# Verify Default OG Image Setup

## File Location
- **Path:** `public/static/share/default.jpg`
- **URL:** `https://inigo.now/static/share/default.jpg`

## Verification Commands

After deployment, run these commands to verify the image is served correctly:

```bash
# Check headers and status
curl -I https://inigo.now/static/share/default.jpg

# Expected output:
# HTTP/2 200
# content-type: image/jpeg
# (no redirect Location header)
```

## Requirements Checklist

- ✅ File exists at `public/static/share/default.jpg`
- ✅ Middleware excludes `/static/share/` paths
- ✅ No conflicting OG default images
- ✅ File size: <2MB (currently 688KB)
- ✅ Format: JPEG
- ✅ Dimensions: 1200×630

## Notes

- Next.js automatically serves files from `public/` directory
- The middleware matcher excludes files with extensions (`.*\\..*`), so `.jpg` files bypass middleware
- `/static/share/` is also explicitly excluded in middleware for extra safety
- No additional configuration needed - Next.js/Vercel handles static file serving automatically

