/*
 *
 * MessagePage actions
 *
 */

import {
  STORE_CONTACT_MANAGER,
  CHANGE_ADD_USERNAME,
  ADD_FETCH_PROFILES,
  ADD_PROFILE_SUCCESS,
  ADD_PROFILE_ERROR,
  SET_SHOW_ADD,
  SET_MESSAGE_SCROLL_TOP,
  ADD_DISCOVERY_CONTACT,
  DEFAULT_PROFILE_ADD,
} from './constants';

import {
  SET_CONTACT_SEARCH,
  STORE_MESSAGES,
} from '../MessageList/constants';



export function defaultProfileAdd(defaultAddName) {
  return {
    type: DEFAULT_PROFILE_ADD,
    defaultAddName
  };
}

export function setAddContactName(addName) {
  return {
    type: CHANGE_ADD_USERNAME,
    addName,
  };
}

export function addFetchProfiles() {
  return {
    type: ADD_FETCH_PROFILES,
  };
}

export function storeContactMgr(contactMgr) {
  return {
    type: STORE_CONTACT_MANAGER,
    contactMgr,
  };
}

export function storeMessages(messages) {
  return {
    type: STORE_MESSAGES,
    messages,
  };
}

export function setContactSearch(newContactSearch) {
  return {
    type: SET_CONTACT_SEARCH,
    newContactSearch,
  };
}

export function addProfileLoaded(addProfile, showAdd, defaultAdd) {
  return {
    type: ADD_PROFILE_SUCCESS,
    addProfile,
    showAdd,
    defaultAdd
  };
}

export function addProfileLoadingError(error) {
  return {
    type: ADD_PROFILE_ERROR,
    error,
  };
}

export function setShowAdd(showAdd) {
  return {
    type: SET_SHOW_ADD,
    showAdd,
  };
}

export function setMsgScrollTop(flag) {
  return {
    type: SET_MESSAGE_SCROLL_TOP,
    flag,
  };
}

export function addDiscoveryContact(id, path) {
  return {
    type: ADD_DISCOVERY_CONTACT,
    id,
    path,
  };
}
