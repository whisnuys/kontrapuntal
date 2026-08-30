import type { APIRoute } from 'astro';

import {
  CMS_STATE_COOKIE,
  CMS_STATE_MAX_AGE_SECONDS,
  buildAuthorizationUrl,
  createOAuthState,
  isCanonicalRequest,
} from '../../../lib/cms-oauth.ts';

export const prerender = false;

const responseHeaders = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export const GET: APIRoute = ({ cookies, redirect, request, url }) => {
  if (!isCanonicalRequest(request.url)) {
    return new Response('CMS authorization is available only on the canonical site.', {
      status: 403,
      headers: responseHeaders,
    });
  }

  if (url.searchParams.get('provider') !== 'github') {
    return new Response('Unsupported CMS authorization provider.', {
      status: 400,
      headers: responseHeaders,
    });
  }

  const clientId = import.meta.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return new Response('CMS authorization is not configured.', {
      status: 503,
      headers: responseHeaders,
    });
  }

  const state = createOAuthState();
  cookies.set(CMS_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: CMS_STATE_MAX_AGE_SECONDS,
    path: '/api/cms',
    sameSite: 'lax',
    secure: true,
  });

  const response = redirect(buildAuthorizationUrl(clientId, state).href, 302);
  for (const [name, value] of Object.entries(responseHeaders)) {
    response.headers.set(name, value);
  }
  return response;
};
