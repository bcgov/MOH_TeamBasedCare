function handler(event) {
  var response = event.response;
  var headers = response.headers;

  // Set HTTP security headers
  // Since JavaScript doesn't allow for hyphens in variable names, we use the dict["key"] notation
  headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload' };
  headers['content-security-policy'] = {
    // We need to hard code both as there isn't a good way of checking environment to dynamically determine which
    value:
      "default-src 'self' https://keycloak.freshworks.club https://common-logon-dev.hlth.gov.bc.ca https://common-logon-test.hlth.gov.bc.ca https://common-logon.hlth.gov.bc.ca; img-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval'; form-action 'self'; frame-ancestors 'self'",
  };
  headers['x-content-type-options'] = { value: 'nosniff' };
  headers['x-frame-options'] = { value: 'DENY' };
  headers['x-xss-protection'] = { value: '1; mode=block' };
  headers['x-download-options'] = { value: 'noopen' };
  headers['server'] = { value: '*' };
  headers['cache-control'] = { value: 'no-store' };
  // Return the response to viewers
  return response;
}
