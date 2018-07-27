import userIdFormReducer from '../reducer';

describe('userIdFormReducer', () => {
  it('returns the initial state', () => {
    expect(userIdFormReducer(undefined, {})).toEqual({});
  });
});
