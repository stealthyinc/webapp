/*
 *
 * BlockPage actions
 *
 */

import {
  STORE_BLOCK_DATA,
} from './constants';

export function storeBlockData(userData, person, isSignedIn) {
  return {
    type: STORE_BLOCK_DATA,
    userData,
    person,
    isSignedIn,
  };
}
