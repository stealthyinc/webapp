
import {
  pollForInvites,
} from '../actions';
import {
  POLL_FOR_INVITES,
} from '../constants';

describe('BlockPage actions', () => {
  describe('Default Action', () => {
    it('has a type of POLL_FOR_INVITES', () => {
      const expected = {
        type: POLL_FOR_INVITES,
      };
      expect(pollForInvites()).toEqual(expected);
    });
  });
});
