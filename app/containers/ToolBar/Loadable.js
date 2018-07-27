/**
 *
 * Asynchronously loads the component for ToolBar
 *
 */

import Loadable from 'react-loadable';

export default Loadable({
  loader: () => import('./index'),
  loading: () => null,
});
