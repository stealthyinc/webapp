
// import { fromJS } from 'immutable';
import messageListReducer from '../reducer';

describe('messageListReducer', () => {
  it('returns the initial state', () => {
    expect(messageListReducer(undefined, {})).toEqual({});
  });
});
