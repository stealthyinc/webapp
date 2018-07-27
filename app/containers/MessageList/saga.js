import { call, put, race, select, take, takeLatest } from 'redux-saga/effects';
import { FETCH_PROFILES, LOAD_PROFILES_SUCCESS } from 'containers/MessageList/constants';
import { profilesLoaded, profileLoadingError } from 'containers/MessageList/actions';
import { eventChannel } from 'redux-saga';
import request from 'utils/request';
import { makeSelectUsername } from 'containers/MessageList/selectors';
import _ from 'lodash';
const firebase = require('firebase');

function* searchProfiles(username) {
  const requestURL = `https://core.blockstack.org/v1/search?query=${username.toLowerCase()}`;
  try {
    const data = yield call(request, requestURL);
    const arr = data.results;
    const results = [];
    if (arr) {
      let key = 0;
      for (const i of arr) {
        let image;
        if (i.profile.image && i.profile.image[0]) {
          image = i.profile.image[0].contentUrl;
        }
        const info = { id: i.username, title: i.profile.name, description: i.username, image, key };
        results.push(info);
        key += 1;
      }
      const re = new RegExp(_.escapeRegExp(username), 'i');
      let isMatch = (result) => re.test(result.title);
      let profiles = _.filter(results, isMatch);
      if (profiles.length < 1) {
        isMatch = (result) => re.test(result.id);
        profiles = _.filter(results, isMatch);
        const error = 'No results found.';
        if (profiles.length < 1) {
          yield put(profileLoadingError(error));
        }
      }
      yield put(profilesLoaded(profiles));
    }
  } catch (error) {
    console.log('User not found', error);
    yield put(profileLoadingError(error));
  }
}

const ircChannels = ["amplifier", "channel", "echo", "megaphone", "relay", "repeater"]

function* subdomainProfiles(username, id) {
  const path = '/global/registration/stealthyIds/'
  const requestURL = `https://core.blockstack.org/v1/users/` + id;
  try {
    const data = yield call (request, requestURL)
    const info = data[id]
    if (info) {
      let title = (ircChannels.indexOf(username) > -1) ? ('#' + username) : (info.profile.name) ? info.profile.name : username
      let image;
      if (info.profile.image && info.profile.image[0]) {
        image = info.profile.image[0].contentUrl;
      }
      const profiles = [{ id, title, description: id, image, key: 0 }]
      if (profiles.length < 1) {
        yield put(profileLoadingError('no results found'));
      }
      else 
        yield put(profilesLoaded(profiles));
    }
  }
  catch (error) {
    yield put(profileLoadingError('no results found'));
  }
}

export function* getProfiles() {
  // Select username from store
  const id = yield select(makeSelectUsername());
  let username = id
  let found = false
  if (id.indexOf('.id.blockstack') > -1) {
    username = id.substring(0, id.indexOf('.id.blockstack'));
    found = true
  }
  else if (id.indexOf('.id') > -1 && !found) {
    username = id.substring(0, id.indexOf('.id'));
  }
  else if (id.indexOf('.stealthy') > -1) {
    username = id.substring(0, id.indexOf('.stealthy'));
  }
  else if (id.indexOf('.personal') > -1) {
    username = id.substring(0, id.indexOf('.personal'));
  }
  yield race([
    call(searchProfiles, username),
    call(subdomainProfiles, username, id),
    take(LOAD_PROFILES_SUCCESS)
  ])
}

export default function* defaultSaga() {
  yield takeLatest(FETCH_PROFILES, getProfiles);
}
