import { eventChannel } from 'redux-saga';
import { take, call, fork, put, select, takeLatest } from 'redux-saga/effects';
import { makeSelectContact, makeSelectPath } from 'containers/ContactList/selectors';
import { makeSelectUserData } from 'containers/BlockPage/selectors';
import { GET_PUBLIC_PROFILE } from 'containers/ContactList/constants';
import { ADD_DISCOVERY_CONTACT } from 'containers/MessagePage/constants';
import { setContactArr, publicProfileLoaded, publicProfileError } from 'containers/ContactList/actions';
import { makeSelectContactMgr } from 'containers/MessagePage/selectors';

import request from 'utils/request';
const firebase = require('firebase');

function getBitCoinWallets(me, contact) {
  let disableWallet = true;
  let myWallet = '';
  let contactWallet = '';
  if (me && me.profile && me.profile.account) {
    for (const i of me.profile.account) {
      if (i.service === 'bitcoin') {
        myWallet = i.identifier;
      }
    }
  }
  if (contact && contact.profile && contact.profile.account) {
    for (const i of contact.profile.account) {
      if (i.service === 'bitcoin') {
        contactWallet = i.identifier;
      }
    }
  }
  disableWallet = !((myWallet && contactWallet));
  return ({ disableWallet, myWallet, contactWallet });
}

export function* getBitcoinProfile() {
  // Select username from store
  const contact = yield select(makeSelectContact());
  const requestURL = `https://core.blockstack.org/v1/users/${contact}`;
  try {
    const data = yield call(request, requestURL);
    const publicProfile = data[contact];
    const userData = yield select(makeSelectUserData());
    const walletInfo = getBitCoinWallets(userData, publicProfile);
    yield put(publicProfileLoaded(publicProfile, walletInfo));
  } catch (error) {
    yield put(publicProfileError(error));
  }
}

function newOps(name = 'data') {
  const o = {};
  const ch = eventChannel((emit) => {
    o.handler = (obj) => {
      emit({ [name]: obj });
    };
    return () => {};
  });
  ch.handler = o.handler;
  return ch;
}

function* runSync(ref, eventType) {
  const ops = newOps();
  yield call([ref, ref.on], eventType, ops.handler);
  while (true) {
    const { data } = yield take(ops);
    const { key } = data;
    const { status } = data.val();
    const id = `${key.replace(/_/g, '\.')}`;
    const contactMgr = yield select(makeSelectContactMgr());
    const existingUserIds = contactMgr.getContactIds();
    if (status == 'pending') {
      if (!existingUserIds.includes(id)) {
        try {
          const requestURL = `https://core.blockstack.org/v1/users/${id}`;
          const fdata = yield call(request, requestURL);
          const { profile } = fdata[id];
          const image = (profile.image) ? profile.image[0].contentUrl : null;
          const contact = { id, title: profile.name, description: id, image };
          yield put(setContactArr(contact));
        } catch (error) {
          console.log('1fbd error here', error);
        }
      } else {
        const path = yield select(makeSelectPath());
        firebase.database().ref(`${path.replace(/\./g, '_')}/${key.replace(/\./g, '_')}`).remove()
        .catch((error) => {
          console.log('2fbd error here', error);
        });
      }
    }
  }
}

export function* getContactProfile() {
  const path = yield select(makeSelectPath());
  const ref = firebase.database().ref(path.replace(/\./g, '_'));
  yield fork(runSync, ref, 'child_added');
}

export default function* defaultSaga() {
  yield takeLatest(GET_PUBLIC_PROFILE, getBitcoinProfile);
  yield takeLatest(ADD_DISCOVERY_CONTACT, getContactProfile);
}
