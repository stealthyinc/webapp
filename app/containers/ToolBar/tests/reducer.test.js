
import { fromJS } from 'immutable';
import toolBarReducer from '../reducer';

describe('toolBarReducer', () => {
  it('returns the initial state', () => {
    expect(toolBarReducer(undefined, {})).toEqual(fromJS({}));
  });
});
