
import { fromJS } from 'immutable';
import messagePageReducer from '../reducer';

describe('messagePageReducer', () => {
  it('returns the initial state', () => {
    expect(messagePageReducer(undefined, {})).toEqual(fromJS({}));
  });
});
