import { createSelector } from 'reselect';

const selectBlock = (state) => state.blockPage;

const makeSelectBlockstackData = () => createSelector(
  selectBlock,
  (blockState) => blockState.blockstackData
);

const makeSelectIsSignedIn = () => createSelector(
  selectBlock,
  (blockState) => blockState.isSignedIn
);

const makeSelectPerson = () => createSelector(
  selectBlock,
  (blockState) => blockState.person
);

const makeSelectUserData = () => createSelector(
  selectBlock,
  (blockState) => blockState.userData
);

const makeSelectAvatarUrl = () => createSelector(
  selectBlock,
  (blockState) => blockState.avatarUrl
);

const makeSelectUserId = () => createSelector(
  selectBlock,
  (blockState) => blockState.userId
);

export {
  selectBlock,
  makeSelectPerson,
  makeSelectUserId,
  makeSelectUserData,
  makeSelectAvatarUrl,
  makeSelectIsSignedIn,
  makeSelectBlockstackData,
};
