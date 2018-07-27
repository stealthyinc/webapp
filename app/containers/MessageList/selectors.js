import { createSelector } from 'reselect';

const selectMessageList = (state) => state.messageList;

const makeSelectMessageList = () => createSelector(
  selectMessageList,
  (messageListState) => messageListState
);

const makeSelectUsername = () => createSelector(
  selectMessageList,
  (messageListState) => messageListState.username
);

const makeSelectLoading = () => createSelector(
  selectMessageList,
  (messageListState) => messageListState.loading
);

const makeSelectError = () => createSelector(
  selectMessageList,
  (messageListState) => messageListState.error
);

const makeSelectMessages = () => createSelector(
  selectMessageList,
  (messageListState) => messageListState.messages
);

const makeSelectNewContactSearch = () => createSelector(
  selectMessageList,
  (messageListState) => messageListState.newContactSearch
);

export {
  selectMessageList,
  makeSelectMessages,
  makeSelectMessageList,
  makeSelectNewContactSearch,
  makeSelectUsername,
  makeSelectLoading,
  makeSelectError,
};
