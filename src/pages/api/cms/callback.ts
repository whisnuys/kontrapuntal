import type { APIRoute } from 'astro';

import {
  CMS_STATE_COOKIE,
  createCspNonce,
  exchangeCodeForToken,
  isCanonicalRequest,
  renderCallbackPage,
  statesMatch,
} from '../../../lib/cms-oauth.ts';

export const prerender = false;

function callbackResponse(
  result: { token: string } | { error: string },
  status = 200,
): Response {
  const nonce = createCspNonce();
  return new Response(renderCallbackPage({ nonce, ...result }), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
      'Content-Type': 'text/html; charset=utf-8',
      Pragma: 'no-cache',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const GET: APIRoute = async ({ cookies, request, url }) => {
  if (!isCanonicalRequest(request.url)) {
    return new Response('CMS authorization is available only on the canonical site.', {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  if (url.searchParams.get('provider') !== 'github') {
    return callbackResponse({ error: 'Unsupported CMS authorization provider.' }, 400);
  }

  const expectedState = cookies.get(CMS_STATE_COOKIE)?.value;
  cookies.delete(CMS_STATE_COOKIE, { path: '/api/cms' });

  const receivedState = url.searchParams.get('state') ?? undefined;
  if (!statesMatch(expectedState, receivedState)) {
    return callbackResponse({ error: 'GitHub authorization could not be verified.' }, 400);
  }

  if (url.searchParams.has('error')) {
    return callbackResponse({ error: 'GitHub authorization was declined.' }, 400);
  }

  const code = url.searchParams.get('code');
  if (!code) {
    return callbackResponse({ error: 'GitHub authorization could not be completed.' }, 400);
  }

  const clientId = import.meta.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return callbackResponse({ error: 'CMS authorization is not configured.' }, 503);
  }

  try {
    const token = await exchangeCodeForToken({ clientId, clientSecret, code });
    return callbackResponse({ token });
  } catch {
    return callbackResponse({ error: 'GitHub authorization could not be completed.' }, 502);
  }
};
