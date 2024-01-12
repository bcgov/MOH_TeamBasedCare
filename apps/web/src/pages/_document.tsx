/* eslint-disable @next/next/no-sync-scripts */
import NextDocument, { Html, Head, Main, NextScript } from 'next/document';

class Document extends NextDocument {
  render() {
    return (
      <Html lang='en'>
        <Head />
        <body>
          <Main />
          <NextScript />
          <script src='scripts/syncscroll.js' />
        </body>
      </Html>
    );
  }
}

export default Document;
