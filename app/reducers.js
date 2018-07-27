/**
 * Combine all reducers in this file and export the combined reducers.
 */

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import globalReducer from 'containers/App/reducer';
import toolBarReducer from 'containers/ToolBar/reducer';
import messagePageReducer from 'containers/MessagePage/reducer';
import contactListReducer from 'containers/ContactList/reducer';
import messageListReducer from 'containers/MessageList/reducer';
import blockPageReducer from 'containers/BlockPage/reducer';
import languageProviderReducer from 'containers/LanguageProvider/reducer';

/**
 * Creates the main reducer with the dynamically injected ones
 */
export default function createReducer(injectedReducers) {
  return combineReducers({
    routing: routerReducer,
    global: globalReducer,
    language: languageProviderReducer,
    toolBar: toolBarReducer,
    contactList: contactListReducer,
    messagePage: messagePageReducer,
    messageList: messageListReducer,
    blockPage: blockPageReducer,
    ...injectedReducers,
  });
}
