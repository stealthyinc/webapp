/*
 *
 * BlockPage reducer
 *
 */

import update from 'immutability-helper';

import {
  STORE_BLOCK_DATA,
} from './constants';

const initialState = {
  userData: {},
  person: {},
  isSignedIn: false,
  avatarUrl: undefined,
  userId: undefined,
};

function blockPageReducer(state = initialState, action) {
  switch (action.type) {
    case STORE_BLOCK_DATA:
      return update(state, {
        userData: { $set: action.userData },
        person: { $set: action.person },
        isSignedIn: { $set: action.isSignedIn },
        avatarUrl: { $set: (action.person && action.person.avatarUrl()) || undefined },
        userId: { $set: (action.userData && action.userData.username) || undefined },
      });
    default:
      return state;
  }
}

export default blockPageReducer;
