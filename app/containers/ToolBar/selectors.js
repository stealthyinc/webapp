import { createSelector } from 'reselect';

const selectToolBar = (state) => state.toolBar;

const makeSelectToolBar = () => createSelector(
  selectToolBar,
  (toolBarState) => toolBarState
);

export default makeSelectToolBar;
export {
  selectToolBar,
};
