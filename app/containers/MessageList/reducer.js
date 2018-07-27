/*
 *
 * MessageList reducer
 *
 */

import update from 'immutability-helper';

import {
  RESET_CONTACT_SEARCH,
  FETCH_PROFILES,
  CHANGE_USERNAME,
  LOAD_PROFILES_SUCCESS,
  LOAD_PROFILES_ERROR,
  STORE_MESSAGES,
  SET_CONTACT_SEARCH,
} from './constants';

// The initial state of the App
const initialState = {
  username: '',
  loading: false,
  error: '',
  profiles: [],
  messages: [],
  newContactSearch: false,
};

function messageListReducer(state = initialState, action) {
  switch (action.type) {
    case RESET_CONTACT_SEARCH:
      return update(state, {
        username: { $set: '' },
        loading: { $set: false },
        error: { $set: '' },
        profiles: { $set: [] },
        messages: { $set: [] },
      });
    case CHANGE_USERNAME:
      return update(state, {
        username: { $set: action.name },
      });
    case FETCH_PROFILES:
      return update(state, {
        loading: { $set: true },
        error: { $set: '' },
        profiles: { $set: [] },
      });
    case LOAD_PROFILES_SUCCESS:
      return update(state, {
        profiles: { $set: action.profiles },
        loading: { $set: false },
      });
    case LOAD_PROFILES_ERROR:
      return update(state, {
        error: { $set: action.error },
        loading: { $set: false },
      });
    case STORE_MESSAGES:
      return update(state, {
        messages: { $set: action.messages },
      });
    case SET_CONTACT_SEARCH:
      return update(state, {
        newContactSearch: { $set: action.newContactSearch },
      });
    default:
      return state;
  }
}

export default messageListReducer;
