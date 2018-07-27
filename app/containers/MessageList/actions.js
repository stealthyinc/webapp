/*
 *
 * MessageList actions
 *
 */

import {
  RESET_CONTACT_SEARCH,
  FETCH_PROFILES,
  LOAD_PROFILES_SUCCESS,
  LOAD_PROFILES_ERROR,
  CHANGE_USERNAME,
} from './constants';

import {
  GET_PUBLIC_PROFILE,
} from '../ContactList/constants';

export function getPublicProfile(contact) {
  return {
    type: GET_PUBLIC_PROFILE,
    contact,
  };
}

export function changeUsername(name) {
  return {
    type: CHANGE_USERNAME,
    name,
  };
}

export function resetContactSearch() {
  return {
    type: RESET_CONTACT_SEARCH,
  };
}

export function fetchProfiles() {
  return {
    type: FETCH_PROFILES,
  };
}

export function profilesLoaded(profiles) {
  return {
    type: LOAD_PROFILES_SUCCESS,
    profiles,
  };
}

export function profileLoadingError(error) {
  return {
    type: LOAD_PROFILES_ERROR,
    error,
  };
}
