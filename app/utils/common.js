// import {Platform} from 'react-native';
const platform = require('platform');

export const NO_SESSION = 'none'

export const getSessionRef = function(aPublicKey) {
  // ud --> user data:
  return `${getRootRef(aPublicKey)}/session`
};

export const getRootRef = function(aPublicKey) {
  // ud --> user data:
  return (process.env.NODE_ENV === 'production') ?
    `/global/ud/${aPublicKey}` :
    `/global/development/ud/${aPublicKey}`
};

var __sessionId = undefined;
//
export const getSessionId = function() {
  if (!__sessionId) {
    const { name } = platform;
    __sessionId = `${name}-${Date.now()}`
  }

  console.log(`INFO(common.js::getSessionId): returning ${__sessionId}`)
  return __sessionId
};
