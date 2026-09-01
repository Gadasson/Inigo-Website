import { NextRequest, NextResponse } from 'next/server';
import { resolveAppDownloadRedirect } from '@/lib/appDownloadRedirect';

export function GET(request: NextRequest) {
  const destination = resolveAppDownloadRedirect(
    request.headers.get('user-agent'),
    request.nextUrl.origin,
  );

  return NextResponse.redirect(destination, 302);
}
