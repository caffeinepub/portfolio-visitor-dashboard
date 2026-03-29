# Portfolio Visitor Dashboard

## Current State
The app has a single hardcoded tracking link (`/track`) that always redirects to `https://rakesh-raja-portfolio-28o.caffeine.xyz/#contact`. The backend stores visits with timestamp, userAgent, and referrer. The dashboard shows stats for all visits.

## Requested Changes (Diff)

### Add
- `url` field to Visit type in backend to store which destination URL was clicked
- Support for any destination URL via query param: `/track?url=<encoded-url>`
- Dashboard UI: input field where user types any URL and gets a custom tracking link
- Filter/breakdown in visitor table showing which destination URL each visit was for

### Modify
- Backend `logVisit` to accept a `destinationUrl` parameter
- TrackPage to read `url` from query params and redirect there (fallback to portfolio URL)
- Dashboard tracking link callout to show a URL input + generator

### Remove
- Hardcoded portfolio URL from TrackPage redirect

## Implementation Plan
1. Update `main.mo`: add `destinationUrl: Text` to Visit type, update `logVisit` signature
2. Update `TrackPage.tsx`: read `url` query param, pass to `logVisit`, redirect there
3. Update `Dashboard.tsx`: add URL input field, generate tracking link as `/track?url=<encoded>`, show destination URL column in visitor table
