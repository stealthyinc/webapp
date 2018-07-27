import contactListReducer from '../reducer';

describe('contactListReducer', () => {
  it('returns the initial state', () => {
    expect(contactListReducer(undefined, {})).toEqual({});
  });
});
