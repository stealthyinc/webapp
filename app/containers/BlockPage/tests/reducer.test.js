
import blockPageReducer from '../reducer';

describe('blockPageReducer', () => {
  let state;
  beforeEach(() => {
    state = {
      blockstackData: {},
    };
  });

  it('returns the initial state', () => {
    const expectedResult = state;
    expect(blockPageReducer(undefined, {})).toEqual(expectedResult);
  });
});
