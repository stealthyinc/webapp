import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { ADD_FETCH_PROFILES, DEFAULT_PROFILE_ADD } from 'containers/MessagePage/constants';
import { addProfileLoaded, addProfileLoadingError } from 'containers/MessagePage/actions';

import request from 'utils/request';
import { makeSelectAddName, makeSelectDefaultAddName, makeSelectContactMgr } from 'containers/MessagePage/selectors';
import _ from 'lodash';

const ircChannels = ["amplifier", "channel", "echo", "megaphone", "relay", "repeater"]

function* addChannelProfile(id) {
  const checkId = `${id}.id`;
  const requestURL = `https://core.blockstack.org/v1/users/` + checkId;
  const contactMgr = yield select(makeSelectContactMgr());
  const existingUserIds = contactMgr.getContactIds();
  if (!existingUserIds.includes(checkId)) {
    try {
      const data = yield call (request, requestURL)
      const info = data[checkId]
      if (info) {
        const username = checkId.substring(0, checkId.indexOf('.stealthy.id'))
        let title = (ircChannels.indexOf(username) > -1) ? ('#' + username) : (info.profile.name) ? info.profile.name : username
        let image;
        if (info.profile.image && info.profile.image[0]) {
          image = info.profile.image[0].contentUrl;
        }
        const addProfile = { id: checkId, title, description: id, image, key: 0 }
        yield put(addProfileLoaded(addProfile, false, true));
      }
    }
    catch (error) {
      yield put(addProfileLoadingError('error'));
    }
  }
}

export function* getAddProfiles() {
  let defaultUsername = yield select(makeSelectDefaultAddName());
  if (defaultUsername === 'relay.stealthy') {
    yield call(addChannelProfile, defaultUsername)
  }
  else {
    const contactMgr = yield select(makeSelectContactMgr());
    const existingUserIds = contactMgr.getContactIds();
    let username = yield select(makeSelectAddName());
    if (defaultUsername) {
      username = defaultUsername
    }
    if (username.indexOf('.id.blockstack') > -1) {
      username = username.substring(0, username.indexOf('.id.blockstack'));
    }
    else if (username.indexOf('.id') > -1) {
      username = username.substring(0, username.indexOf('.id'));
    }
    const requestURL = `https://core.blockstack.org/v1/search?query=${username.toLowerCase()}`;
    const checkId1 = `${username}.id`;
    const checkId2 = `${username}.id.blockstack`;
    if (!existingUserIds.includes(checkId1) || !existingUserIds.includes(checkId2)) {
      try {
        const data = yield call(request, requestURL);
        const arr = data.results;
        const results = [];
        if (arr) {
          let key = 0;
          for (const i of arr) {
            let image;
            if (i.profile.image) {
              image = i.profile.image[0].contentUrl;
            }
            const info = { id: i.username, title: i.profile.name, description: i.username, image, key };
            results.push(info);
            key += 1;
          }
          const re = new RegExp(_.escapeRegExp(username), 'i');
          const isMatch = (result) => re.test(result.id);
          const profiles = _.filter(results, isMatch);
          if (profiles.length < 1) {
            yield put(profileLoadingError(error));
          } else {
            for (const i of profiles) {
              if (i.id === username) {
                if (defaultUsername)
                  yield put(addProfileLoaded(i, false, true));
                else 
                  yield put(addProfileLoaded(i, true, false));
                break;
              }
            }
          }
        }
      } catch (error) {
        yield put(addProfileLoadingError('error'));
      }
    } else {
      yield put(addProfileLoaded([], false, false));
    }
  }
}

export default function* defaultSaga() {
  yield takeLatest(ADD_FETCH_PROFILES, getAddProfiles);
  yield takeEvery(DEFAULT_PROFILE_ADD, getAddProfiles);
}
