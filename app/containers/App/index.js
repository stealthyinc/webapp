/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import React from 'react';
import { Helmet } from 'react-helmet';

import BlockPage from 'containers/BlockPage/Loadable';

export default function App() {
  return (
    <div>
      <Helmet
        titleTemplate="%s - Stealthy | Decentralized Communication"
        defaultTitle="Stealthy | Decentralized Communication"
      >
        <meta name="description" content="Decentralized Communication" />
      </Helmet>
      <BlockPage />
    </div>
  );
}
