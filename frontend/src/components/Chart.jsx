import Highcharts from 'highcharts';
import HighchartsReactModule from 'highcharts-react-official';
import { chartBase } from '../lib/chartTheme';

// Under Vite's CJS interop, the default import resolves to the module object
// ({ HighchartsReact, default }) rather than the component itself. Unwrap it
// so we always end up with the actual React component regardless of interop.
const HighchartsReact =
  HighchartsReactModule.HighchartsReact ||
  HighchartsReactModule.default ||
  HighchartsReactModule;

/**
 * Themed Highcharts wrapper. Pass a partial `options` object; it is deep-merged
 * over the shared brand theme in ../lib/chartTheme.
 */
export default function Chart({ options }) {
  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={Highcharts.merge(true, {}, chartBase, options)}
    />
  );
}
