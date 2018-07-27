/*
 *
 * MessagePage reducer
 *
 */

import update from 'immutability-helper';
const { ContactManager } = require('./../../contactManager.js');

import {
  STORE_CONTACT_MANAGER,
  CHANGE_ADD_USERNAME,
  ADD_PROFILE_SUCCESS,
  ADD_PROFILE_ERROR,
  SET_SHOW_ADD,
  DEFAULT_PROFILE_ADD,
  SET_MESSAGE_SCROLL_TOP,
} from './constants';

const initialState = {
  contactMgr: new ContactManager(),
  addName: '',
  defaultAddName: '',
  addProfile: {},
  error: '',
  showAdd: false,
  defaultAdd: false,
  msgScrollTop: false,
};

function messagePageReducer(state = initialState, action) {
  switch (action.type) {
    case DEFAULT_PROFILE_ADD:
      return update(state, {
        defaultAddName: { $set: action.defaultAddName },
      });
    case STORE_CONTACT_MANAGER:
      return update(state, {
        contactMgr: { $set: action.contactMgr },
      });
    case CHANGE_ADD_USERNAME:
      return update(state, {
        addName: { $set: action.addName },
      });
    case ADD_PROFILE_SUCCESS:
      return update(state, {
        addProfile: { $set: action.addProfile },
        showAdd: { $set: action.showAdd },
        defaultAdd: { $set: action.defaultAdd },
        error: { $set: '' },
      });
    case ADD_PROFILE_ERROR:
      return update(state, {
        addProfile: { $set: {} },
        error: { $set: action.error },
      });
    case SET_SHOW_ADD:
      return update(state, {
        showAdd: { $set: action.showAdd },
      });
    case SET_MESSAGE_SCROLL_TOP:
      return update(state, {
        msgScrollTop: { $set: action.flag },
      });
    default:
      return state;
  }
}

export default messagePageReducer;
