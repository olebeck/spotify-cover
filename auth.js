function base64url(bytes) {
    return btoa(String.fromCharCode(...bytes))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
}
function randomBytes(size) {
    return crypto.getRandomValues(new Uint8Array(size))
  }

/**
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 */
async function fetchJSON(input, init) {
    const response = await fetch(input, init)
    const body = await response.json()
    if (!response.ok) {
      throw new ErrorResponse(response, body)
    }
    return body
  }
  
  class ErrorResponse extends Error {
    /**
     * @param {Response} response
     * @param {any} body
     */
    constructor(response, body) {
      super(response.statusText)
      this.status = response.status
      this.body = body
    }
  }

class spotifyapi {
    token = null;

    constructor(client_id, redirect_uri, scope) {
        this.client_id = client_id;
        this.redirect_uri = redirect_uri;
        this.scope = scope
        var code = new URLSearchParams(location.search).get("code");
        let tokenSet = JSON.parse(localStorage.getItem('tokenSet'))
        if(!tokenSet) {
            if(code != undefined) {
                this.completeLogin();
            } else {
                this.beginLogin();
            }
        }

    }

    async generateCodeChallenge(code_verifier) {
        const codeVerifierBytes = new TextEncoder().encode(code_verifier)
        const hashBuffer = await crypto.subtle.digest('SHA-256', codeVerifierBytes)
        return base64url(new Uint8Array(hashBuffer))
    }

    async beginLogin() {
        // https://tools.ietf.org/html/rfc7636#section-4.1
        const code_verifier = base64url(randomBytes(96))
        const state = base64url(randomBytes(96))
      
        const params = new URLSearchParams({
          client_id: this.client_id,
          response_type: 'code',
          redirect_uri: this.redirect_uri,
          code_challenge_method: 'S256',
          code_challenge: await this.generateCodeChallenge(code_verifier),
          state: state,
           scope: this.scope,
        })
      
        sessionStorage.setItem('code_verifier', code_verifier)
        sessionStorage.setItem('state', state)
      
        location.href = `https://accounts.spotify.com/authorize?${params}`
      }

    async completeLogin() {
        const code_verifier = sessionStorage.getItem('code_verifier')
        const state = sessionStorage.getItem('state')
        
        const params = new URLSearchParams(location.search)
        
        if (params.has('error')) {
            throw new Error(params.get('error'))
        } else if (!params.has('state')) {
            throw new Error('State missing from response')
        } else if (params.get('state') !== state) {
            throw new Error('State mismatch')
        } else if (!params.has('code')) {
            throw new Error('Code missing from response')
        }
        
        await this.createAccessToken({
            grant_type: 'authorization_code',
            code: params.get('code'),
            redirect_uri: self.redirect_uri,
            code_verifier: code_verifier,
        });
        location.href = this.redirect_uri;
    }

    async fetchWithToken(input) {
        const accessToken = await this.getAccessToken()
      
        if (!accessToken) {
          throw new ErrorResponse(new Response(undefined, { status: 401 }), {})
        }
      
        return fetchJSON(input, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
    }

    /**
     * @param {Record<string, string>} params
     * @returns {Promise<string>}
     */
    async createAccessToken(params) {
        const response = await fetchJSON('https://accounts.spotify.com/api/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: this.client_id,
            ...params,
        }),
        })
    
        const accessToken = response.access_token
        const expires_at = Date.now() + 1000 * response.expires_in
    
        localStorage.setItem('tokenSet', JSON.stringify({ ...response, expires_at }))
    
        return accessToken
    }

    /**
     * @returns {Promise<string>}
     */
    async getAccessToken() {
        let tokenSet = JSON.parse(localStorage.getItem('tokenSet'))
    
        if (!tokenSet) return
    
        if (tokenSet.expires_at < Date.now()) {
        tokenSet = await createAccessToken({
            grant_type: 'refresh_token',
            refresh_token: tokenSet.refresh_token,
        })
        }
    
        return tokenSet.access_token
    }
}