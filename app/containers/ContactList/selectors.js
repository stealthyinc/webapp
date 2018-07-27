/**
 * Direct selector to the contactList state domain
 */
import { createSelector } from 'reselect';

const selectContactList = (state) => state.contactList;

const makeSelectProfiles = () => createSelector(
  selectContactList,
  (contactListState) => contactListState.profiles
);

const makeSelectPublicProfile = () => createSelector(
  selectContactList,
  (contactListState) => contactListState.publicProfile
);

const makeSelectContact = () => createSelector(
  selectContactList,
  (contactListState) => contactListState.contact
);

const makeSelectWalletInfo = () => createSelector(
  selectContactList,
  (contactListState) => contactListState.walletInfo
);

const makeSelectId = () => createSelector(
  selectContactList,
  (contactListState) => contactListState.id
);

const makeSelectPath = () => createSelector(
  selectContactList,
  (contactListState) => contactListState.path
);

const makeSelectContactArr = () => createSelector(
  selectContactList,
  (contactListState) => contactListState.contactArr
);

export {
  makeSelectId,
  makeSelectPath,
  selectContactList,
  makeSelectContact,
  makeSelectProfiles,
  makeSelectWalletInfo,
  makeSelectContactArr,
  makeSelectPublicProfile,
};
