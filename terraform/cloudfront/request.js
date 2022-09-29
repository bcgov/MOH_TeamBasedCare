// Next.js request handler
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Convert requests ending in numbers into [step].index
  var numericMatch = uri.match(/\/([0-9]+)$/);
  if (numericMatch) {
    request.uri = uri.substring(0, uri.length - numericMatch[1].length) + '[step].html';
    return request;
  }

  // Append ".html" if no extension given
  if (uri.match(/\/[^/.]+$/)) {
    request.uri = uri + '.html';
    return request;
  }

  // Append "index.html" if ends in a /
  if (uri.match(/.+\/$/)) {
    request.uri = uri + 'index.html';
    return request;
  }

  if (uri.match(/robots.txt|sitemap.xml/)) {
    request.uri = uri.replace(/robots.txt|sitemap.xml/, 'index.html');
    return request;
  }

  return request;
}
