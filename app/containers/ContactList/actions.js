/*
 *
 * ContactList actions
 *
 */

import {
  GET_PUBLIC_PROFILE,
  PUBLIC_KEY_LOADED,
  PUBLIC_KEY_ERROR,
  SET_CONTACT_ARR,
} from './constants';

export function getPublicProfile(contact) {
  return {
    type: GET_PUBLIC_PROFILE,
    contact,
  };
}

export function publicProfileLoaded(publicProfile, walletInfo) {
  return {
    type: PUBLIC_KEY_LOADED,
    publicProfile,
    walletInfo,
  };
}

export function publicProfileError(error) {
  return {
    type: PUBLIC_KEY_ERROR,
    error,
  };
}

export function setContactArr(contact) {
  return {
    type: SET_CONTACT_ARR,
    contact,
  };
}
