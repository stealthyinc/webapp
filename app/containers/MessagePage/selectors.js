import { createSelector } from 'reselect';

const selectMessagePage = (state) => state.messagePage;

const makeSelectMessagePage = () => createSelector(
  selectMessagePage,
  (messagePageState) => messagePageState
);

const makeSelectContactMgr = () => createSelector(
  selectMessagePage,
  (messagePageState) => messagePageState.contactMgr
);

const makeSelectAddName = () => createSelector(
  selectMessagePage,
  (messagePageState) => messagePageState.addName
);

const makeSelectDefaultAddName = () => createSelector(
  selectMessagePage,
  (messagePageState) => messagePageState.defaultAddName
);

const makeSelectAddProfile = () => createSelector(
  selectMessagePage,
  (messagePageState) => messagePageState.addProfile
);

const makeSelectShowAdd = () => createSelector(
  selectMessagePage,
  (messagePageState) => messagePageState.showAdd
);

const makeSelectDefaultAdd = () => createSelector(
  selectMessagePage,
  (messagePageState) => messagePageState.defaultAdd
);

const makeSelectScrollTop = () => createSelector(
  selectMessagePage,
  (messagePageState) => messagePageState.msgScrollTop
);

export {
  selectMessagePage,
  makeSelectShowAdd,
  makeSelectDefaultAdd,
  makeSelectAddName,
  makeSelectDefaultAddName,
  makeSelectAddProfile,
  makeSelectContactMgr,
  makeSelectMessagePage,
  makeSelectScrollTop,
};
