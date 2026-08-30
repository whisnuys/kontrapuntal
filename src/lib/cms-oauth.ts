import { randomBytes, timingSafeEqual } from 'node:crypto';

export const CMS_ORIGIN = 'https://kontrapuntal.whisnuys.com';
export const CMS_STATE_COOKIE = 'kontrapuntal_cms_oauth_state';
export const CMS_STATE_MAX_AGE_SECONDS = 10 * 60;

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

interface TokenExchangeOptions {
  clientId: string;
  clientSecret: string;
  code: string;
  fetchImpl?: typeof fetch;
}

export function createOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

export function createCspNonce(): string {
  return randomBytes(18).toString('base64url');
}

export function buildAuthorizationUrl(clientId: string, state: string): URL {
  const url = new URL(GITHUB_AUTHORIZE_URL);
  const callback = new URL('/api/cms/callback', CMS_ORIGIN);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback.href,
    scope: 'repo',
    state,
  }).toString();
  return url;
}

export function isCanonicalRequest(requestUrl: string): boolean {
  try {
    return new URL(requestUrl).origin === CMS_ORIGIN;
  } catch {
    return false;
  }
}

export function statesMatch(expected: string | undefined, received: string | undefined): boolean {
  if (!expected || !received) {
    return false;
  }

  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export async function exchangeCodeForToken({
  clientId,
  clientSecret,
  code,
  fetchImpl = fetch,
}: TokenExchangeOptions): Promise<string> {
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  });
  const response = await fetchImpl(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(10_000),
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('GitHub token exchange failed.');
  }

  const payload: unknown = await response.json();
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('access_token' in payload) ||
    typeof payload.access_token !== 'string' ||
    payload.access_token.length === 0
  ) {
    throw new Error('GitHub token response is missing an access token.');
  }

  return payload.access_token;
}

function serializeForInlineScript(value: string): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

type CallbackResult =
  | { nonce: string; token: string; error?: never }
  | { nonce: string; error: string; token?: never };

export function renderCallbackPage(resultData: CallbackResult): string {
  const { nonce } = resultData;
  const isSuccess = 'token' in resultData;
  const result = isSuccess
    ? `authorization:github:success:${JSON.stringify({ token: resultData.token })}`
    : `authorization:github:error:${JSON.stringify({ error: resultData.error })}`;
  const targetOrigin = serializeForInlineScript(CMS_ORIGIN);
  const authorizingMessage = serializeForInlineScript('authorizing:github');
  const resultMessage = serializeForInlineScript(result);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>Authorizing Kontrapuntal</title>
  </head>
  <body>
    <p>${isSuccess ? 'Completing GitHub authorization…' : 'GitHub authorization could not be completed.'}</p>
    <script nonce="${nonce}">
      const targetOrigin = ${targetOrigin};
      const sendResult = (event) => {
        if (event.origin !== targetOrigin || event.source !== window.opener) return;
        window.removeEventListener('message', sendResult);
        window.opener?.postMessage(${resultMessage}, targetOrigin);
      };
      window.addEventListener('message', sendResult);
      window.opener?.postMessage(${authorizingMessage}, targetOrigin);
    </script>
  </body>
</html>`;
}
