/*
 *
 * ContactList reducer
 *
 */
import update from 'immutability-helper';

import {
  GET_PUBLIC_PROFILE,
  PUBLIC_KEY_LOADED,
  PUBLIC_KEY_ERROR,
  SET_CONTACT_ARR,
} from './constants';

import {
  ADD_DISCOVERY_CONTACT,
} from '../MessagePage/constants';

const initialState = {
  contact: '',
  publicProfile: {},
  error: '',
  walletInfo: {},
  id: '',
  path: '',
  contactArr: [],
};

function contactListReducer(state = initialState, action) {
  switch (action.type) {
    case GET_PUBLIC_PROFILE:
      return update(state, {
        contact: { $set: action.contact },
        publicProfile: { $set: {} },
        error: { $set: '' },
      });
    case PUBLIC_KEY_LOADED:
      return update(state, {
        publicProfile: { $set: action.publicProfile },
        walletInfo: { $set: action.walletInfo },
        error: { $set: '' },
      });
    case PUBLIC_KEY_ERROR:
      return update(state, {
        publicProfile: { $set: '' },
        error: { $set: action.error },
      });
    case ADD_DISCOVERY_CONTACT:
      return update(state, {
        id: { $set: action.id },
        path: { $set: action.path },
      });
    case SET_CONTACT_ARR:
      return update(state, {
        contactArr: { $set: [action.contact, ...state.contactArr] },
      });
    default:
      return state;
  }
}

export default contactListReducer;
