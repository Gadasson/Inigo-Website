# iOS Universal Links Verification

## Configuration

- **Domain:** `inigo.now`
- **Bundle ID:** `now.inigo.app`
- **App ID:** `5D7CFYURW8.now.inigo.app`
- **AASA File:** `/.well-known/apple-app-site-association`

## File Locations

- **Primary (standard):** `public/.well-known/apple-app-site-association`
- **Legacy (backup):** `public/apple-app-site-association`

Both locations are configured to serve with `Content-Type: application/json` headers.

## Verification Steps

### 1. Check AASA File is Accessible

```bash
curl -I https://inigo.now/.well-known/apple-app-site-association
```

**Expected:**
- `HTTP/2 200`
- `content-type: application/json`
- No redirect `Location` header

### 2. Verify AASA Content

```bash
curl https://inigo.now/.well-known/apple-app-site-association
```

**Expected JSON:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["5D7CFYURW8.now.inigo.app"],
        "paths": ["/e/*", "/s/*", "/event/*", "/spot/*"]
      }
    ]
  }
}
```

### 3. Test Universal Links on Device

**Prerequisites:**
- App must be installed fresh on device (or reinstall to refresh Universal Links cache)
- Device must have internet connection

**Testing Steps:**

1. Install the app fresh on an iOS device
2. Open Notes app
3. Paste: `https://inigo.now/e/78`
4. Tap the link

**Expected Result:**
- ✅ Opens the app directly to Experience screen
- ❌ If it opens Safari instead, check:
  - Associated Domains entitlements in app (`applinks:inigo.now`)
  - AASA file is accessible (step 1)
  - App was installed fresh (Universal Links cache)

## Troubleshooting

### Universal Links Not Working

1. **Verify AASA file:**
   ```bash
   curl https://inigo.now/.well-known/apple-app-site-association
   ```

2. **Check headers:**
   ```bash
   curl -I https://inigo.now/.well-known/apple-app-site-association
   ```
   Must return `200` with `Content-Type: application/json`

3. **Verify app entitlements:**
   - App must have `Associated Domains` capability
   - Domain must be: `applinks:inigo.now`

4. **Clear Universal Links cache:**
   - Reinstall the app fresh
   - Or use: Settings → Developer → Reset Universal Links Cache (if available)

5. **Test in different contexts:**
   - Notes app (most reliable)
   - Safari (should work)
   - WhatsApp (may be picky, but should work if Notes works)

## Notes

- Universal Links work in Notes/Safari even when WhatsApp is picky
- The AASA file must be served with `Content-Type: application/json` (no `.json` extension)
- Both `/apple-app-site-association` and `/.well-known/apple-app-site-association` are configured for compatibility
- Middleware excludes `/.well-known/` paths to prevent locale redirects

