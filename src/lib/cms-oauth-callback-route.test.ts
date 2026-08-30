import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { GET } from '../pages/api/cms/callback.ts';
import { CMS_ORIGIN, CMS_STATE_COOKIE } from './cms-oauth.ts';

function callbackContext(query: string, cookieValue?: string) {
  let deletedCookie = '';
  const url = new URL(`/api/cms/callback?provider=github&${query}`, CMS_ORIGIN);
  const cookies = {
    get(name: string) {
      return name === CMS_STATE_COOKIE && cookieValue ? { value: cookieValue } : undefined;
    },
    delete(name: string) {
      deletedCookie = name;
    },
  };

  return {
    context: { cookies, request: new Request(url), url },
    deletedCookie: () => deletedCookie,
  };
}

describe('CMS OAuth callback route', () => {
  test('rejects success and denial callbacks with missing or mismatched state', async () => {
    for (const [query, cookie] of [
      ['error=access_denied', undefined],
      ['error=access_denied&state=modified', 'expected'],
      ['code=oauth-code', undefined],
      ['code=oauth-code&state=modified', 'expected'],
    ] as const) {
      const fixture = callbackContext(query, cookie);
      const response = await GET(fixture.context as never);
      const html = await response.text();

      assert.equal(response.status, 400);
      assert.match(html, /authorization:github:error:/);
      assert.match(html, /could not be verified/i);
      assert.doesNotMatch(html, /was declined/i);
      assert.equal(fixture.deletedCookie(), CMS_STATE_COOKIE);
    }
  });

  test('reports a declined authorization only after state validation succeeds', async () => {
    const fixture = callbackContext('error=access_denied&state=expected', 'expected');
    const response = await GET(fixture.context as never);
    const html = await response.text();

    assert.equal(response.status, 400);
    assert.match(html, /was declined/i);
  });
});
