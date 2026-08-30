import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  CMS_ORIGIN,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  isCanonicalRequest,
  renderCallbackPage,
  statesMatch,
} from './cms-oauth.ts';

describe('Decap GitHub OAuth', () => {
  test('authorizes the private repository through the fixed production callback', () => {
    const url = buildAuthorizationUrl('client-id', 'state-value');

    assert.equal(url.origin, 'https://github.com');
    assert.equal(url.pathname, '/login/oauth/authorize');
    assert.equal(url.searchParams.get('client_id'), 'client-id');
    assert.equal(
      url.searchParams.get('redirect_uri'),
      'https://kontrapuntal.whisnuys.com/api/cms/callback',
    );
    assert.equal(url.searchParams.get('scope'), 'repo');
    assert.equal(url.searchParams.get('state'), 'state-value');
  });

  test('accepts only the canonical production request origin', () => {
    assert.equal(isCanonicalRequest(`${CMS_ORIGIN}/api/cms/auth`), true);
    assert.equal(isCanonicalRequest('https://preview.example/api/cms/auth'), false);
    assert.equal(isCanonicalRequest('not-a-url'), false);
  });

  test('rejects missing or modified state values', () => {
    assert.equal(statesMatch('expected-state', 'expected-state'), true);
    assert.equal(statesMatch('expected-state', 'modified-state'), false);
    assert.equal(statesMatch('expected-state', undefined), false);
    assert.equal(statesMatch(undefined, 'expected-state'), false);
  });

  test('exchanges the code on the server and returns only the access token', async () => {
    let requestedUrl = '';
    let requestedInit: RequestInit | undefined;
    const fetchImpl: typeof fetch = async (input, init) => {
      requestedUrl = String(input);
      requestedInit = init;
      return Response.json({
        access_token: 'github-token',
        scope: 'repo',
        token_type: 'bearer',
      });
    };

    const token = await exchangeCodeForToken({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      code: 'oauth-code',
      fetchImpl,
    });

    assert.equal(token, 'github-token');
    assert.equal(requestedUrl, 'https://github.com/login/oauth/access_token');
    assert.equal(requestedInit?.method, 'POST');
    assert.equal(requestedInit?.headers instanceof Headers, true);
    assert.equal((requestedInit?.headers as Headers).get('Accept'), 'application/json');
    assert.equal(
      requestedInit?.body,
      new URLSearchParams({
        client_id: 'client-id',
        client_secret: 'client-secret',
        code: 'oauth-code',
      }).toString(),
    );
  });

  test('fails closed when GitHub rejects the exchange or omits a token', async () => {
    await assert.rejects(
      exchangeCodeForToken({
        clientId: 'client-id',
        clientSecret: 'client-secret',
        code: 'bad-code',
        fetchImpl: async () => Response.json({ error: 'bad_verification_code' }, { status: 401 }),
      }),
      /token exchange failed/i,
    );

    await assert.rejects(
      exchangeCodeForToken({
        clientId: 'client-id',
        clientSecret: 'client-secret',
        code: 'bad-code',
        fetchImpl: async () => Response.json({ scope: 'repo', token_type: 'bearer' }),
      }),
      /missing an access token/i,
    );
  });

  test('sends the Decap result only to the canonical origin and escapes token markup', () => {
    const html = renderCallbackPage({
      nonce: 'nonce-value',
      token: 'abc</script><script>alert(1)</script>',
    });

    assert.match(html, /authorizing:github/);
    assert.match(html, /authorization:github:success:/);
    assert.match(html, /https:\/\/kontrapuntal\.whisnuys\.com/);
    assert.doesNotMatch(html, /postMessage\([^)]*,\s*["']\*["']/);
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
    assert.match(html, /nonce="nonce-value"/);
  });

  test('reports a safe Decap error without exposing provider details', () => {
    const html = renderCallbackPage({
      nonce: 'nonce-value',
      error: 'GitHub authorization could not be completed.',
    });

    assert.match(html, /authorization:github:error:/);
    assert.match(html, /GitHub authorization could not be completed\./);
    assert.doesNotMatch(html, /client-secret|bad_verification_code/);
  });
});
