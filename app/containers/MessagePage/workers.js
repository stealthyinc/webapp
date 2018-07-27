const { MESSAGE_TYPE, MESSAGE_STATE, ChatMessage } =
  require('./../../messaging/chatMessage.js');
const { ConversationManager } = require('./../../messaging/conversationManager.js');
const { OfflineMessagingServices } =
  require('./../../messaging/offlineMessagingServices.js');

const utils = require('../../utils.js');
const { Anonalytics } = require('../../utils/anonalytics.js');

const blockstack = require('blockstack');
const platform = require('platform');
const firebase = require('firebase');
const FirebaseIO = require('./../../filesystem/firebaseIO.js');
const GaiaIO = require('./../../filesystem/gaiaIO.js');
const { IndexedIO } = require('./../../filesystem/indexedIO.js');
const { InvitationPolling, ResponsePolling } = require('./../../network/polling.js');
const { HeartBeat } = require('./../../network/heartBeat.js');
const SdpManager = require('./../../network/sdpManager.js');
const { ConnectionManager } = require('./../../network/connectionManager.js');
const { RESPONSE_TYPE, OFFER_TYPE, PEER_OBJ_TYPES } =
  require('./../../network/PeerManager.js');
const { getSimplePeerOpts } = require('./../../network/utils.js');

const { AVPeerMgr } = require('./../../network/avPeerMgr.js');
const adapter = require('webrtc-adapter');
const { getScreenConstraints,
         getChromeExtensionStatus } = require('./../../ext/Screen-Capturing');
// import { requestScreenShare } from 'iframe-screenshare';

const SimplePeer = require('simple-peer');

const constants = require('./../../constants.js');
const statusIndicators = constants.statusIndicators;
const { ContactManager } = require('./../../contactManager.js');

const Config = require('Config');

import getQueryString from 'utils/getQueryString';

const RELAY_IDS = [
  // 'relay.id',
  'relay.stealthy.id'
];

// TODO: need a better way to indicate an ID is a relay:
//       * subdomain reg:  e.g. blockstack.relay.id   (relay.id being the subdoain)
//       * something we burn into the blockchain for a given id with a date.
//              e.g.:   pbj.id.relay_04_12_2018, pbj.id.norelay_05_12_2018
//
function isRelayId(aUserId) {
  return utils.isDef(aUserId) && RELAY_IDS.includes(aUserId);
}


// Dev. constants not set in ctor:
const ENCRYPT_HB = true;
const ENABLE_AUTOCONNECT = true;
const ENCRYPT_INDEXED_IO = true;
const ENABLE_RECEIPTS = true;
const ENABLE_RELAY = true;

// Bugs to Fix (temporary workarounds):
const WORKAROUND__DISABLE_REFLECTED_PACKET = true;

// Dev. "constants" now set in ctor based on user name--change them there, not here:
const DONT_CHANGE_THIS_HERE_DO_IT_IN_THE_CTOR = undefined;
let ENABLE_GAIA = DONT_CHANGE_THIS_HERE_DO_IT_IN_THE_CTOR;
let ENCRYPT_MESSAGES = DONT_CHANGE_THIS_HERE_DO_IT_IN_THE_CTOR;
let ENCRYPT_CONTACTS = DONT_CHANGE_THIS_HERE_DO_IT_IN_THE_CTOR;
let ENCRYPT_SETTINGS = DONT_CHANGE_THIS_HERE_DO_IT_IN_THE_CTOR;
let ENCRYPT_SDP = DONT_CHANGE_THIS_HERE_DO_IT_IN_THE_CTOR;
let STEALTHY_PAGE = DONT_CHANGE_THIS_HERE_DO_IT_IN_THE_CTOR;

// Logging Scopes
const LOG_AUTOCONNECT = false;
const LOG_GAIAIO = false;
const LOG_INVITEPOLLING = false;
const LOG_RESPONSEPOLLING = false;

const stealthyTestIds = [
  'pbj.id',
  'alexc.id',
  'relay.id',
  'stealthy.id',
  'braphaav.personal.id',
  'amplifier.steatlhy.id',
  'channel.stealthy.id',
  'echo.stealthy.id',
  'megaphone.stealthy.id',
  'relay.steatlhy.id',
  'repeater.stealthy.id',
  'prabhaav.id.blockstack',
]

//
//  React Component Callbacks
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//

export function componentDidMountWork() {
  if (this.state.initWithFetchedData ||
      !this.props.userId) {
    return;
  }

  this.myTimer.logEvent('Enter componentDidMountWork')

  this.logger('Build Date: ', Config.BUILD_DATE_STAMP);
  this.logger('Build Time: ', Config.BUILD_TIME_STAMP);
  this.logger('Build Version: ', Config.BUILD_VERSION);

  if (!firebase.auth().currentUser) {
    firebase.auth().signInAnonymously()
    .then(() => {
      this.io = (ENABLE_GAIA) ?
        new GaiaIO(this.logger, LOG_GAIAIO) :
        new FirebaseIO(this.logger, firebase, STEALTHY_PAGE);

      this._fetchUserSettings();
    });
  } else {
    this.io = (ENABLE_GAIA) ?
      new GaiaIO(this.logger, LOG_GAIAIO) :
      new FirebaseIO(this.logger, firebase, STEALTHY_PAGE);

    this._fetchUserSettings();
  }

  this.props.addSteps(constants.getJoyRideSteps());
}

export async function shutdown() {
  // Most important things to do on shutdown:
  //
  //  Write any stray messages to disk.
  //
  this._writeConversations();

  this.offlineMsgSvc.skipSendService();
  this.offlineMsgSvc.sendMessagesToStorage();
  this.offlineMsgSvc.skipSendService(false);

  // We stopped doing this after every incoming msg etc. to
  // speed things along, hence write here.
  //   - to avoid the popup, we should have a timer periodically write
  //     all these and use a dirty flag to determine if we even need to do this.
  this._writeContactList(contactMgr.getAllContacts());

  // Clearing invite/response json files (but if the person chooses to stay,
  // then you want to tell the infrastructure it may need to reissue those?).
  //
}

export function startWebRtc() {
  this.logger('MessagePage::startWebRtc:');

  const { userId } = this.props;

  if (!utils.isDef(this.sdpManager)) {
    utils.throwIfUndef('userId', userId);
    utils.throwIfUndef('this.io', this.io);
    utils.throwIfUndef('this.anonalytics', this.anonalytics);

    this.sdpManager = new SdpManager(userId, this.io, this.anonalytics);
  }

  if (!utils.isDef(this.connectionManager)) {
    utils.throwIfUndef('this.anonalytics', this.anonalytics);

    this.connectionManager = new ConnectionManager(
      this.logger,
      this.sdpManager,
      this.anonalytics,
      this.handleNewConnection,
      this.handleIncomingMessage,
      this.handleCloseConnection);
  }

  if (!utils.isDef(this.invitePolling)) {
    const userIds = this.props.contactMgr.getContactIds();
    this._initAndLaunchSdpInvitePolling(userIds);
  } else {
    this.invitePolling.pollForSdpInvitations();
  }

  this.invitePolling.on('received', this._handleSdpInvite);
}

export function stopWebRtc() {
  this.logger('MessagePage::stopWebrtc:');

  if (this.invitePolling) {
    this.invitePolling.stopPolling();
  }

  this.peerMgr.destroyPeers();

  if (this.sdpManager) {
    const deletionPromises = [];
    for (const contactId of this.props.contactMgr.getContactIds()) {
      deletionPromises.push(this.sdpManager.deleteSdpInvite(contactId));
      deletionPromises.push(this.sdpManager.deleteSdpResponse(contactId));
    }
  }

  const contactMgr = new ContactManager();
  contactMgr.clone(this.props.contactMgr);

  for (const userId of contactMgr.getContactIds()) {
    const userStatus = this.peerMgr.isUserConnected(userId) ?
      statusIndicators.available : statusIndicators.offline;
    contactMgr.setStatus(userId, userStatus);
  }

  this.props.storeContactMgr(contactMgr);
}

// Don't muck with this--it affects the WebPack HMR I believe (multiple timers
// objects etc. if this is not here):
export function componentWillUnmountWork() {
  this.logger('MessagePage::componentWillUnmountWork:');
  this.shuttingDown = true;

  if (this.invitePolling) {
    this.invitePolling.stopPolling();
  }
  this.invitePolling = undefined;

  if (this.heartBeat) {
    this.heartBeat.stopBeat();
    this.heartBeat.stopMonitor();
  }
  this.heartBeat = undefined;

  this.peerMgr.destroyPeers();

  this.offlineMsgSvc.stopSendService();
  this.offlineMsgSvc.stopRecvService();

  // Don't put anything below here in this fn--it's not guaranteed to be run
  // due to some issue tbd.
  // ------------------------------------------------------------------------

  // Remove any invite & response JSON files outstanding.
  if (this.sdpManager) {
    const deletionPromises = [];
    for (const contactId of this.props.contactMgr.getContactIds()) {
      deletionPromises.push(this.sdpManager.deleteSdpInvite(contactId));
      deletionPromises.push(this.sdpManager.deleteSdpResponse(contactId));
    }
  }

  // let deleteResolves = Promise.all(deletionPromises);

  this.setState({ initWithFetchedData: false });
}

//
//  Initialization
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
export function setupDevelopmentConstants() {

  const url = window.location.href;
  if (url.indexOf('localhost') > -1) {
    STEALTHY_PAGE = 'LOCALHOST';
  } else if (url.indexOf('test') > -1) {
    STEALTHY_PAGE = 'TEST_STEALTHY';
  } else {
    STEALTHY_PAGE = 'STEALTHY';
  }

  if (this.props.userId === 'pbj.id') {
    // PBJ Dev Settings:
    ENABLE_GAIA = true;
    ENCRYPT_MESSAGES = true;
    ENCRYPT_CONTACTS = true;
    ENCRYPT_SETTINGS = true;
    ENCRYPT_SDP = true;
  } else if (this.props.userId === 'alexc.id') {
    // AC Dev Settings:
    ENABLE_GAIA = true;
    ENCRYPT_MESSAGES = true;
    ENCRYPT_CONTACTS = true;
    ENCRYPT_SETTINGS = true;
    ENCRYPT_SDP = true;
  } else {
    ENABLE_GAIA = true;
    ENCRYPT_MESSAGES = true;
    ENCRYPT_CONTACTS = true;
    ENCRYPT_SETTINGS = true;
    ENCRYPT_SDP = true;
  }
}

export function _initWithContacts(contactArr) {
  this.myTimer.logEvent('Enter _initWithContacts')

  const contactMgr = new ContactManager();
  contactMgr.initFromStoredArray(contactArr);
  contactMgr.setAllContactsStatus();

  // Modify tool for plug-in to only focus on the contact we're workign with.
  //
  if (this.props.plugin) {
    // TODO: fix this when we handle TLDs properly.
    const length = getQueryString('length');
    for (let i = 0; i < length; i++) {
      const str = 'id'+i
      const recipientId = getQueryString(str)
      if (contactMgr.getContact(recipientId)) {
        contactMgr.setPlugInMode(recipientId);
        contactMgr.setActiveContact(contactMgr.getContact(recipientId))
      } else {
        // TODO: We need to search for and add this contact or throw.
        this.props.defaultProfileAdd(recipientId);
      }
    }
  }

  this.props.storeContactMgr(contactMgr);

  if (this.state.webrtc) {
    const userIds = contactMgr.getContactIds();

    // TODO: can probably get rid of this conditional safely--with an empty
    //       list the promise will resolve similarly--just quicker? (AC)
    if (userIds.length === 0) {
      // New user or empty contact list.
      this.logger('Init & Launch Invite Polling:');
      this._initAndLaunchSdpInvitePolling(userIds);
      this.invitePolling.on('received', this._handleSdpInvite);
    } else {
      // Remove any old invites and responses before polling:
      //
      const deletionPromises = [];
      for (const contactId of userIds) {
        deletionPromises.push(this.sdpManager.deleteSdpInvite(contactId));
        deletionPromises.push(this.sdpManager.deleteSdpResponse(contactId));
      }
      Promise.all(deletionPromises)
      .then((values) => {
        // Initialize and launch the file based signaling system (polling):
        //
        this._initAndLaunchSdpInvitePolling(userIds);
        this.invitePolling.on('received', this._handleSdpInvite);
      });
    }
  }


  this.offlineMsgSvc =
    new OfflineMessagingServices(this.logger, this.props.userId, this.idxIo, contactMgr.getContacts());
  this.offlineMsgSvc.startSendService();

  this.offlineMsgSvc.on('new messages', (messages) => {
    const unreceivedMessages = [];
    for (const message of messages) {
      if (message) {
        if ((message.type === MESSAGE_TYPE.TEXT) &&
                   (!this.conversations.hasMessage(message))) {
          unreceivedMessages.push(message);
        } else if (message.type === MESSAGE_TYPE.RECEIPT) {
          this.handleReceipt(message);
        }
      }
    }

    this.addIncomingMessage(unreceivedMessages);
    this.updateContactOrderAndStatus(unreceivedMessages);
    this.sendMessageReceipts(unreceivedMessages);
  });

  this.offlineMsgSvc.on('offline messages sent', () => {
    // The offline service has sent messages and updated their status.
    // We want to do a redraw of the current message window to update
    // status indicators (spinners--> solid gray checkmarks) and perform
    // a bundle write to store the change.
    this._writeConversations();

    const ac = this.props.contactMgr.getActiveContact();
    if (ac) {
      const newMessages = this._getMessageArray(ac.id);
      this.props.storeMessages(newMessages);
    }
  });


  // Lots of possiblities here (i.e. lazy load etc.)
  this.conversations = new ConversationManager(
    this.logger, this.props.userId, this.idxIo);

  this.conversations.loadContactBundles(contactMgr.getContactIds())
  .then(() => {
    const updatedContactMgr = new ContactManager();
    updatedContactMgr.clone(this.props.contactMgr);
    const activeContact = updatedContactMgr.getActiveContact();

    const seenMessages = this.markReceivedMessagesSeen(activeContact.id);
    this.sendMessageReceipts(seenMessages);

    const newMessages = this._getMessageArrayForContact(activeContact);

    // TODO: send these as a packet to the other user.

    this.offlineMsgSvc.startRecvService();

    // Update the summarys for all contacts. Redux makes it so that you have to
    // use a setter to fix this issue (setting the object property directly
    // doesn't work b/c it's read only).
    //   TODO: clean this up into method(s) on conversations and contactMgr (AC)
    const activeContactId = activeContact.id;
    for (const contactId of updatedContactMgr.getContactIds()) {
      const messages = this.conversations.getMessages(contactId);

      const lastMessage = (messages && (messages.length > 0)) ?
        messages[messages.length - 1].content : '';
      updatedContactMgr.setSummary(contactId, lastMessage);

      if (contactId !== activeContactId) {
        let count = 0;
        for (const message of messages) {
          // Skip messages we wrote--we only count the ones we receive (
          // unless they are in the special case where we sent them to
          // ourselves).
          if (!(message.to === message.from) &&
              (this.props.userId === message.from)) {
            continue;
          }

          if (!message.seen) {
            count++;
          }
          if (count === 99) {
            break;
          }
        }
        updatedContactMgr.setUnread(contactId, count);
      }
    }

    this.props.storeMessages(newMessages);
    this.props.storeContactMgr(updatedContactMgr);
  })
  .catch((err) => {
    this.offlineMsgSvc.startRecvService();
    this.logger('INFO: No contact bundles to load.');
  });


  const { userId } = this.props;

  const heartbeatIoDriver = (ENABLE_GAIA) ?
    new GaiaIO(this.logger, LOG_GAIAIO) :
    new FirebaseIO(this.logger, firebase, STEALTHY_PAGE);
  this.heartBeat = new HeartBeat(
    this.logger, heartbeatIoDriver, userId, contactMgr.getContacts(), this.privateKey, ENCRYPT_HB);
  this.heartBeat.on('monitor', this._handleHeartBeatMonitor);
  this.heartBeat.startBeat();

  this.setState({ initWithFetchedData: true });
}

export function _fetchUserSettings() {
  this.myTimer.logEvent('Enter _fetchUserSettings')

  let settings = {};

  const { userId, plugin } = this.props;
  this.io.readLocalFile(userId, 'settings.json')
  .then((settingsData) => {
    if (settingsData && settingsData !== null) {
      settings = (ENCRYPT_SETTINGS) ?
        utils.decryptToObj(this.privateKey, settingsData) : settingsData;
    } else {
      // THIS HAPPENS FIRST TIME ONLY
      // centralized discovery on by default
      this.logger('No data read from settings file. Initializing with default settings.');
      if (!plugin) {
        this.props.defaultProfileAdd('relay.stealthy');
        this.props.defaultProfileAdd('stealthy');
        this.handleIntroOpen();
      }
    }

    this._initSettings(settings);
    this._fetchDataAndCompleteInit();
  })
  .catch((error) => {
    // TODO: Prabhaav--shouldn't this set the default settings from above?
    this.logger('Error', error);
    this._initSettings({});
    this._fetchDataAndCompleteInit();
    this.logger('ERROR: Reading settings.');
  });
}

export function _fetchDataAndCompleteInit() {
  this.myTimer.logEvent('Enter _fetchDataAndCompleteInit')

  const { userId } = this.props;

  if (this.anonalytics === undefined) {
    this.anonalytics = new Anonalytics(userId);
    this.anonalytics.setDatabase(firebase);
  }

  this.anonalytics.aeLogin();
  this.anonalytics.aePlatformDescription(platform.description);

  const appToken = getQueryString('app');
  let context = utils.getAppContext(appToken);
  this.anonalytics.aeLoginContext(context);

  this.idxIo = new IndexedIO(this.logger, this.io, userId, this.privateKey, this.publicKey, ENCRYPT_INDEXED_IO);

  this.io.writeLocalFile(userId, 'pk.txt', this.publicKey);

  // TODO: probably disable init of this with webrtc
  if (this.state.webrtc) {
    this.sdpManager = new SdpManager(userId, this.io, this.anonalytics);
    this.connectionManager = new ConnectionManager(
      this.logger,
      this.sdpManager,
      this.anonalytics,
      this.handleNewConnection,
      this.handleIncomingMessage,
      this.handleCloseConnection);
  }

  let contactArr = [];
  this.io.readLocalFile(userId, 'contacts.json')
  .then((contactsData) => {
    // debugger
    if (contactsData && contactsData !== null) {
      contactArr = (ENCRYPT_CONTACTS) ?
        utils.decryptToObj(this.privateKey, contactsData) : contactsData;
    } else {
      this.logger('No data read from contacts file. Initializing with no contacts.');
      contactArr = [];
    }
    this._initWithContacts(contactArr);
    // add query contact if there is one
    const queryContact = getQueryString('add');
    const existingUserIds = this.props.contactMgr.getAllContactIds();
    const checkId = `${queryContact}.id`;
    if (queryContact && !existingUserIds.includes(checkId)) {
      this.props.setAddContactName(queryContact);
      this.props.addFetchProfiles();
    }
  })
  .catch((error) => {
    // debugger
    this.logger('Error', error);
    this._initWithContacts([]);
    this.logger('ERROR: Reading contacts.');
  });
}

export function _initSettings(settings) {
  this.setState({
    console: settings.console,
    search: settings.search,
    discovery: settings.discovery,
    webrtc: settings.webrtc,
  });
  if (process.env.NODE_ENV === 'production') {
    this.readContactDiscovery(settings.discovery);
  }
  else {
    if (stealthyTestIds.indexOf(this.props.userId) > -1) {
      this.readContactDiscovery(settings.discovery, true);
    }
  }
}

export function readContactDiscovery(discovery, development=false) {
  const { userId } = this.props;
  const cleanId = userId.replace(/_/g, '\.');
  let path = `/global/discovery/`;
  if (development) {
    path += `development/${cleanId}`
  }
  else {
    path += `${cleanId}`
  }
  if (discovery) {
    this.props.addDiscoveryContact(cleanId, path);
  }
}

export function writeContactDiscovery(contactId, development=false) {
  const { userId } = this.props;
  const cleanContactId = contactId.replace(/\./g, '_');
  const cleanId = userId.replace(/\./g, '_');
  let path = `/global/discovery/`;
  if (development) {
    path += `development/${cleanContactId}`
  }
  else {
    path += `${cleanContactId}`;
  }
  const ref = firebase.database().ref(`${path}/${cleanId}`);
  ref.once('value')
  .then((snapshot) => {
    if (!snapshot.val()) {
      ref.set({ status: 'pending' });
    }
  });
}

//
//  Contact Management
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
export function handleSearchSelect(contact) {
  let selectedUserId = contact.id;
  // Workaround for missing TLD on contact ids
  if (!selectedUserId.endsWith('.id')) {
    selectedUserId += '.id';
  }
  const existingUserIds = this.props.contactMgr.getContactIds();

  let selfAddCheck = false;
  if (process.env.NODE_ENV === 'production' && selectedUserId !== 'alexc.id') {
    selfAddCheck = (selectedUserId === this.props.userId);
  }
  if (existingUserIds.includes(selectedUserId) || selfAddCheck) {
    // TODO(AC): Understand set state and how it works with classes better.
    //           i.e. do we need to create a new ContactManager or can we
    //           just change the selection to get the changes to take.
    // TODO(AC): Is this even a use-case anymore? When is a searched contact
    //           in our list of existing user ids?
    //
    const contactMgr = new ContactManager();
    contactMgr.initFromArray(this.props.contactMgr.getAllContacts(), contact);
    this.props.storeContactMgr(contactMgr);
    this.props.setContactSearch(false);
  } else {
    this.handleContactAdd(contact, selectedUserId);
  }
  this.props.addProfileLoaded([], false, false)
}

export function handleContactAdd(contact, id, status = undefined) {
  if (this.anonalytics)
    this.anonalytics.aeContactAdded();

  this._fetchPublicKey(id)
  .then((publicKey) => {
    if (publicKey) {
      this.logger(`Adding contact ${id}. Read public key: ${publicKey}`);
    } else {
      this.logger(`Adding contact ${id}. UNABLE TO READ PUBLIC KEY`);
    }

    const contactMgr = new ContactManager();
    contactMgr.initFromArray(this.props.contactMgr.getAllContacts());
    contactMgr.addNewContact(contact, id, publicKey);

    if (this.state.webrtc) {
      if (this.invitePolling) {
        this.invitePolling.updateContactIds(contactMgr.getContactIds());
      }
    }
    this._writeContactList(contactMgr.getContacts());


    // TODO(AC): probably change heartBeat to accept a contactMgr
    this.heartBeat.addContact(id, publicKey);


    this.conversations.createConversation(id);
    this._writeConversations();


    this.offlineMsgSvc.setContacts(contactMgr.getContacts());

    const newMessages = this._getMessageArray(id);
    this.props.storeContactMgr(contactMgr);
    this.props.storeMessages(newMessages);
    this.props.setContactSearch(false);
    if (status) {
      const index = (id.indexOf('.id.blockstack') > 0) ? id.indexOf('.id.blockstack') : id.indexOf('.id')
      const key = id.substring(0, index).replace(/\./g, '_');
      firebase.database().ref(`${this.props.path.replace(/\./g, '_')}/${key}`).remove();
    }
  });
}

export function handleDeleteContact(e, { contact }) {
  const contactMgr = new ContactManager();
  contactMgr.clone(this.props.contactMgr);
  contactMgr.deleteContact(contact);

  if (this.state.webrtc) {
    if (this.invitePolling) {
      this.invitePolling.updateContactIds(contactMgr.getContactIds());
    }
  }
  this._writeContactList(contactMgr.getAllContacts());

  this.conversations.removeConversation(contact.id);
  this._writeConversations();

  this.offlineMsgSvc.removeMessages(contact);

  this.peerMgr.removePeerAllTypes(contact.id);

  this.heartBeat.deleteContact(contact.id);

  this.offlineMsgSvc.setContacts(contactMgr.getContacts());

  const activeUser = contactMgr.getActiveContact();
  let newMessages = []
  if (activeUser) {
    const activeUserId = activeUser.id;
    const newMessages = this._getMessageArray(activeUserId);
    contactMgr.clearUnread(activeUserId);
  }

  if (this.state.discovery) {
    const index = (contact.id.indexOf('.id.blockstack') > 0) ? contact.id.indexOf('.id.blockstack') : contact.id.indexOf('.id')
    const key = contact.id.substring(0, index).replace(/\./g, '_');
    firebase.database().ref(`${this.props.path.replace(/\./g, '_')}/${key}`).remove();
  }

  this.props.storeContactMgr(contactMgr);
  this.handleDeleteClose();
  this.props.storeMessages(newMessages);
}

export function handleRadio (e, { name }) {
  const settings = {
    console: this.state.console,
    search: this.state.search,
    discovery: this.state.discovery,
    webrtc: this.state.webrtc,
  };
  if (name === 'console') {
    this.setState({ console: !this.state.console });
    settings.console = !this.state.console;
    this.anonalytics.aeSettings(`console:${settings.console}`);
  } else if (name === 'search') {
    this.setState({ search: !this.state.search });
    settings.search = !this.state.search;
    this.anonalytics.aeSettings(`passiveSearch:${settings.search}`);
  } else if (name === 'discovery') {
    this.readContactDiscovery(!this.state.discovery);
    this.setState({ discovery: !this.state.discovery });
    settings.discovery = !this.state.discovery;
    this.anonalytics.aeSettings(`discovery:${settings.discovery}`);
    if (settings.discovery) {
      if (process.env.NODE_ENV === 'production' || stealthyTestIds.indexOf(this.props.userId) > -1) {
        this.readContactDiscovery(settings.discovery);
      }
    }
  } else if (name === 'webrtc') {
    this.setState({ webrtc: !this.state.webrtc });
    settings.webrtc = !this.state.webrtc;
    this.anonalytics.aeSettings(`webrtc:${settings.webrtc}`);
    if (!settings.webrtc) {
      try {
        this.stopWebRtc();
      } catch (err) {
        this.logger(`ERROR: Recommend restarting Stealthy. Problem encountered stopping WebRTC services.\n${err}\n`);
      }
    } else {
      try {
        this.startWebRtc();
      } catch (err) {
        this.logger(`ERROR: Recommend restarting Stealthy. Problem encountered starting WebRTC services.\n${err}\n`);
      }
    }
  }
  this._writeSettings(settings);
}

//
//  Connectivity
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
export function handleNewConnection(newConnectionUserId, aPeerObjType) {
  this.myTimer.logEvent(`handleNewConnection ${newConnectionUserId}`);
  this.logger(this.myTimer.getEvents());

  this.logger(`New connection to ${newConnectionUserId}, ${aPeerObjType}!`);
  this.anonalytics.aeWebRtcConnectionEstablished();

  // TODO: need to check connections read messages before sending these unsent.
  //       If found, need to update our messge properties.
  //
  const unsentMessages =
    this.conversations.getUnsentMessages(newConnectionUserId);

  this.peerMgr.setPeerConnected(newConnectionUserId, aPeerObjType);
  for (const message of unsentMessages) {
    const outgoingPublicKey =
      this.props.contactMgr.getPublicKey(newConnectionUserId);

    const packet = (ENCRYPT_MESSAGES) ?
      utils.encryptObj(outgoingPublicKey, message) :
      JSON.stringify(message);

    const peerObj = this.peerMgr.getConnection(newConnectionUserId);
    if (peerObj) {
      message.sent = true;
      peerObj.send(packet);
    } else {
      this.logger('Peer not connected in handleNewConnection.');
    }
  }

  this._writeConversations();

  const contactMgr = new ContactManager();
  contactMgr.clone(this.props.contactMgr);
  contactMgr.setStatus(newConnectionUserId, statusIndicators.available);

  this.props.storeContactMgr(contactMgr);
}

export function handleCloseConnection(closeConnectionId, aPeerObjType) {
  if (this.shuttingDown) {
    this.logger('Skipping handleCloseConnection.');
    return;
  }

  this.logger(`Closing connection to ${closeConnectionId}:`);
  // TODO: what type?
  this.peerMgr.removePeer(closeConnectionId, aPeerObjType);

  // Remove the invite or response file to prevent future issues (i.e. Reading
  // the invite again by accident or the response).
  if (this.sdpManager) {
    if (aPeerObjType === OFFER_TYPE) {
      this.sdpManager.deleteSdpInvite(closeConnectionId);
      this.logger(`Deleted SDP Invite for ${closeConnectionId}.`);
    } else {
      this.sdpManager.deleteSdpResponse(closeConnectionId);
      this.logger(`Deleted SDP Response for ${closeConnectionId}.`);
    }
  }

  // TODO: Look into if we still want this
  // Remove from active invite list (invitation failed--permits retry).
  if (aPeerObjType === OFFER_TYPE &&
      this.invitations.includes(closeConnectionId)) {
    const index = this.invitations.indexOf(closeConnectionId);
    if (index !== -1) {
      this.invitations.splice(index, 1);
    }
  }

  // Remove from polling exclusion list (i.e. if we're closing a response
  // peer obj, then start polling for invites again so we can issue a response.)
  if (aPeerObjType === RESPONSE_TYPE) {
    this.invitePolling.unexcludeUserId(closeConnectionId);
  }

  // Update the status indicators of the contacts array. (Must create
  // a new object or set state call will not result in a render).
  // TODO: refactor out status indicators into a dictionary to make
  //       this more efficient.
  if (!this.peerMgr.isUserConnected(closeConnectionId)) {
    const contactMgr = new ContactManager();
    contactMgr.clone(this.props.contactMgr);
    contactMgr.setStatus(closeConnectionId, statusIndicators.offline);

    this.props.storeContactMgr(contactMgr);
  }
}

export function _updateContactPubKeys() {
  // Check for heartbeat files not yet collected and update if found ...
  //    - concerns about clobbering contactMgr here
  const contactMgr = this.props.contactMgr;
  for (const contact of contactMgr.getContacts()) {
    const contactIds = [];
    const fetchPromises = [];
    if (!contactMgr.hasPublicKey(contact)) {
      contactIds.push(contact.id);
      fetchPromises.push(this._fetchPublicKey(contact.id));
    }
    Promise.all(fetchPromises)
    .then((arrPks) => {
      if (arrPks &&
          (arrPks.length > 0) &&
          (arrPks.length === contactIds.length)) {
        let needsUpdate = false;
        const updatePkContactMgr = new ContactManager();
        updatePkContactMgr.clone(this.props.contactMgr);

        for (let index = 0; index < arrPks.length; index++) {
          const contactId = contactIds[index];
          const pk = arrPks[index];
          if (pk) {
            needsUpdate = true;
            updatePkContactMgr.setPublicKey(contactId, pk);
            this.heartBeat.addContact(contactId, pk);
          }
        }

        if (needsUpdate) {
          this.props.storeContactMgr(updatePkContactMgr);
          this._writeContactList(updatePkContactMgr.getAllContacts());
        }
      }
    })
    .catch((err) => {
      // ignore ...
    });
  }
}

export function _handleHeartBeatMonitor(theHeartBeats) {
  const currTimeMs = Date.now();

  const contactMgr = new ContactManager();
  contactMgr.clone(this.props.contactMgr);

  for (const contact of contactMgr.getContacts()) {
    const contactId = contact.id;

    let timeStr = 'presence unknown.';
    const timeSinceOnlineMs = undefined;
    if ((contactId in theHeartBeats) && theHeartBeats[contactId]) {
      const timeSinceOnlineMs = currTimeMs - theHeartBeats[contactId].time;
      timeStr = ContactManager.getContactTimeStr(timeSinceOnlineMs);
    }
    contactMgr.setTime(contactId, timeStr);
    contactMgr.setTimeMs(contactId, timeSinceOnlineMs);
  }

  this.props.storeContactMgr(contactMgr);

  this._updateContactPubKeys();

  if (!ENABLE_AUTOCONNECT || !this.state.webrtc) {
    return;
  }
  // Oh oh, what is this? Some Auto-connect hackery.
  const MAX_CONTACTS_PER_ITERATION = 10;
  this.log(LOG_AUTOCONNECT, '');
  this.log(LOG_AUTOCONNECT, 'AutoConnect v0.1');
  this.log(LOG_AUTOCONNECT, '...............................................................');
  let index = 0;
  const tooMuchTimeOffline = 3 * 60 * 1000;
  for (const contact of contactMgr.getContacts()) {
    const contactId = contact.id;
    if (index >= MAX_CONTACTS_PER_ITERATION) {
      break;
    }

    if (!(contactId in theHeartBeats) ||
        (theHeartBeats[contactId] === undefined)) {
      this.log(LOG_AUTOCONNECT, `Skipping ${contactId}, insufficient heartbeat data.`);
      continue;
    }

    if (this.invitations.includes(contactId)) {
      this.log(LOG_AUTOCONNECT, `Skipping ${contactId}, there is a pending invite for them.`);
      continue;
    }

    if (this.peerMgr.isUserConnected(contactId)) {
      this.log(LOG_AUTOCONNECT, `Skipping ${contactId}, they're connected.`);
      continue;
    }

    const timeSinceOnline = currTimeMs - theHeartBeats[contactId].time;
    if (timeSinceOnline > tooMuchTimeOffline) {
      const timeStr = ContactManager.getContactTimeStr(timeSinceOnline);
      this.log(LOG_AUTOCONNECT, `Skipping ${contactId}, they were ${timeStr}`);
      continue;
    }

    this.myTimer.logEvent(`AutoConnect Invite ${contactId}`);
    this._inviteUserToChat(contactId, contact.publicKey);
    index++;
  }
}

export function _inviteUserToChat(anOutgoingUserId, aPublicKey) {
  // Establish a connection to the user if possible and not already done:
  this.invitations.push(anOutgoingUserId);

  // TODO:
  //   1. Prevent a double click from clobbering/issuing two invites.
  //
  //
  this.logger(`   Sending SDP invite to ${anOutgoingUserId}`);
  const targetUserPublicKey = (ENCRYPT_SDP) ?
    aPublicKey : undefined;
  this.logger(`\n\n\nTARGET PUBLIC KEY ${targetUserPublicKey}, ENCRYPT_SDP=${ENCRYPT_SDP}`);

  // Send an SDP Invitation and poll for a response.
  const p = this.connectionManager.invite(anOutgoingUserId, targetUserPublicKey);

  const privateKey = (ENCRYPT_SDP) ? this.privateKey : undefined;
  const responsePolling = new ResponsePolling(
    this.logger, this.sdpManager, anOutgoingUserId, privateKey, LOG_RESPONSEPOLLING);
  // TODO: refactor to a separate handler function (AC)
  responsePolling.pollForSdpResponse()
  .then((sdpResponse) => {
    if (this.state.webrtc) {
      if (sdpResponse) {
        this.logger(`   Completing connection to ${anOutgoingUserId}`);

        p.signal(sdpResponse);
        this.peerMgr.addOfferPeer(anOutgoingUserId, p);

        // Remove from invite list (invitation is complete):
        const index = this.invitations.indexOf(anOutgoingUserId);
        if (index !== -1) {
          this.invitations.splice(index, 1);
        }
      } else {
        this.logger(`   SDP invite to ${anOutgoingUserId} was unsuccessful. Cancelling.`);
        p.destroy();
        // Don't thing we need to do more as the peer doesn't get added to Peer
        // Manager unless we get a response.
      }
    } else {
      // Peer manager was disabled--likely to stop WebRTC -- destroy our peer
      // and move on.
      this.logger(`   SDP invite to ${anOutgoingUserId} ignored. WebRTC disabled.`);
      p.destroy();
    }
  });
}

export function _initAndLaunchSdpInvitePolling(userIds) {
  this.myTimer.logEvent('Enter _initAndLaunchSdpInvitePolling')

  const privateKey = (ENCRYPT_SDP) ? this.privateKey : undefined;
  this.invitePolling = new InvitationPolling(
    this.logger, this.sdpManager, userIds, privateKey, LOG_INVITEPOLLING);
  this.invitePolling.pollForSdpInvitations();
}

export function _handleSdpInvite(userId, sdpInvite) {
  this.myTimer.logEvent(`_handleSdpInvite ${userId}`);
  const targetUserPublicKey = this.props.contactMgr.getPublicKey(userId);

  if (targetUserPublicKey) {
    this._initiateSdpResponse(userId, targetUserPublicKey, sdpInvite);
  } else {
    this._fetchPublicKey(userId)
    .then((publicKey) => {
      if (publicKey) {
        this.logger(`Fetched publicKey for ${userId}.`);
        this._initiateSdpResponse(userId, publicKey, sdpInvite);

        const contactMgr = new ContactManager();
        contactMgr.clone(this.props.contactMgr);
        contactMgr.setPublicKey(userId, publicKey);
        this._writeContactList(contactMgr.getAllContacts());

        this.props.storeContactMgr(contactMgr);
      } else {
        this.logger(`Unable to fetch publicKey for ${userId}. Cannot write response.`);
      }
    });
  }
}

export function _initiateSdpResponse(aTargetUserId, aTargetUserPublicKey, anSdpInvite) {
  this.myTimer.logEvent(`_initiateSdpResponse ${aTargetUserId}`);

  const targetUserPublicKey = (ENCRYPT_SDP) ? aTargetUserPublicKey : undefined;

  const peerObj = this.connectionManager.respond(
    anSdpInvite, aTargetUserId, targetUserPublicKey);
  if (peerObj) {
    this.peerMgr.addResponsePeer(aTargetUserId, peerObj);
    this.invitePolling.excludeUserId(aTargetUserId);
  }
}

//
//  Messaging
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
// TODO: refactor--this is doing a whole bunch that can be reused/reduced

import chatIcon from '../../images/blue256.png';

function notifyMe() {
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var options = {
      body: "New Message",
      icon: chatIcon
    };
    var notification = new Notification("Stealthy", options);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var options = {
          body: "New Message",
          icon: chatIcon
        };
        var notification = new Notification("Stealthy", options);
      }
    });
  }

  // At last, if the user has denied notifications, and you
  // want to be respectful there is no need to bother them any more.
}

// The main benefit of this over handleOutgoingMessage is to send a multitude of
// the same message with the same time stamp while reducing the number of writes
// to the conversations and contacts files.
//
export function handleOutgoingRelayMessage(theRecipients, aChatMsgTemplate) {
  for (const outgoingUserId of theRecipients) {
    const chatMsg = new ChatMessage();
    chatMsg.clone(aChatMsgTemplate);
    chatMsg.to = outgoingUserId;
    this.anonalytics.aeMessageSent();

    const outgoingPublicKey = this.props.contactMgr.getPublicKey(outgoingUserId);
    if (outgoingPublicKey) {
      if (this.peerMgr.isUserConnected(outgoingUserId)) {
        this._sendOutgoingMessage(outgoingUserId, chatMsg, outgoingPublicKey);
      } else {
        this._sendOutgoingMessageOffline(chatMsg);

        if ((!this.invitations.includes(outgoingUserId)) && this.state.webrtc ) {
          this._inviteUserToChat(outgoingUserId, outgoingPublicKey);
        }
      }
    } else {
      this._fetchPublicKey(outgoingUserId)
      .then((publicKey) => {
        if (publicKey) {
          const contactMgr = new ContactManager();
          contactMgr.clone(this.props.contactMgr);
          contactMgr.setPublicKey(outgoingUserId, publicKey);
          this._writeContactList(contactMgr.getAllContacts());

          this.props.storeContactMgr(contactMgr);

          this.logger(`Fetched publicKey for ${outgoingUserId}.`);

          if (this.peerMgr.isUserConnected(outgoingUserId)) {
            this._sendOutgoingMessage(outgoingUserId, chatMsg, publicKey);
          } else {
            this._sendOutgoingMessageOffline(chatMsg);

            if ((!this.invitations.includes(outgoingUserId)) && this.state.webrtc ) {
              this._inviteUserToChat(outgoingUserId, publicKey);
            }
          }
        } else {
          this.logger(`Unable to fetch publicKey for ${outgoingUserId}. Cannot write response.`);
        }
      });
    }

    this.conversations.addMessage(chatMsg);
  }

  this._writeConversations();


  const contactMgr = new ContactManager();
  contactMgr.clone(this.props.contactMgr);
  for (const outgoingUserId of theRecipients) {
    contactMgr.setSummary(outgoingUserId, chatMsgTemplate.content);
  }
  this._writeContactList(contactMgr.getAllContacts());
  this.props.storeContactMgr(contactMgr);

  const newMessages = this._getMessageArray(contactMgr.getActiveContact().id);
  this.props.storeMessages(newMessages);
}

export function handleOutgoingMessage(text) {
  const { userId } = this.props;
  const outgoingUserId = (this.props.contactMgr.getActiveContact()) ?
    this.props.contactMgr.getActiveContact().id : undefined;
  if (this.state.discovery) {
    if (process.env.NODE_ENV === 'production') {
      this.writeContactDiscovery(outgoingUserId);
    }
    else {
      const index = stealthyTestIds.indexOf(this.props.userId)
      if (index > -1) {
        this.writeContactDiscovery(outgoingUserId, true);
      }
    }
  }

  this.anonalytics.aeMessageSent();
  const chatMsg = new ChatMessage();
  chatMsg.init(
    userId,
    outgoingUserId,
    this._getNewMessageId(),
    text,
    Date.now());

  const outgoingPublicKey = this.props.contactMgr.getPublicKey(outgoingUserId);

  if (outgoingPublicKey) {
    if (this.peerMgr.isUserConnected(outgoingUserId)) {
      this._sendOutgoingMessage(outgoingUserId, chatMsg, outgoingPublicKey);
    } else {
      this._sendOutgoingMessageOffline(chatMsg);

      if ((!this.invitations.includes(outgoingUserId)) && this.state.webrtc ) {
        this._inviteUserToChat(outgoingUserId, outgoingPublicKey);
      }
    }
  } else {
    this._fetchPublicKey(outgoingUserId)
    .then((publicKey) => {
      if (publicKey) {
        this.logger(`Fetched publicKey for ${outgoingUserId}.`);

        if (this.peerMgr.isUserConnected(outgoingUserId)) {
          this._sendOutgoingMessage(outgoingUserId, chatMsg, publicKey);
        } else {
          this._sendOutgoingMessageOffline(chatMsg);

          if ((!this.invitations.includes(outgoingUserId)) && this.state.webrtc ) {
            this._inviteUserToChat(outgoingUserId, publicKey);
          }
        }

        const contactMgr = new ContactManager();
        contactMgr.clone(this.props.contactMgr);
        contactMgr.setPublicKey(outgoingUserId, publicKey);
        this._writeContactList(contactMgr.getAllContacts());

        this.props.storeContactMgr(contactMgr);
      } else {
        this.logger(`Unable to fetch publicKey for ${outgoingUserId}. Cannot write response.`);
      }
    });
  }

  this.conversations.addMessage(chatMsg);
  this._writeConversations();

  const contactMgr = new ContactManager();
  contactMgr.clone(this.props.contactMgr);
  contactMgr.moveContactToTop(outgoingUserId);
  contactMgr.setSummary(outgoingUserId, chatMsg.content);
  this._writeContactList(contactMgr.getAllContacts());

  this.props.storeContactMgr(contactMgr);

  const newMessages = this._getMessageArray(outgoingUserId);
  this.props.storeMessages(newMessages);
}

// Might need to rethink this as it can probably get called multiple times
// concurrently (TODO: AC - think about queuing new packets for processing)
export function handleIncomingMessage(incomingUserId, packet) {
  const chatMsg = (ENCRYPT_MESSAGES) ?
    utils.decryptToObj(this.privateKey, packet) : JSON.parse(packet);

  if (chatMsg && (chatMsg.type === MESSAGE_TYPE.VIDEO_SDP)) {
    this.logger(`Received VIDEO_SDP message from ${chatMsg.from}.`);
    // TODO: what if we're already video chatting ...
    if (chatMsg.content.type === 'offer') {
      // Pops a dialog asking user if yes/no on video invite.
      //   - If yes, calls handleVideoOpen, which requires that chatMsg is
      //     assigned to a member (shitty way to pass it).
      //   - If no, calls handleVideoInviteClose, which should unassign the
      //     member, and ideally TODO, send a response to the invitee that
      //     there call was rejected.
      this.videoInviteChatMsg = chatMsg;
      this.handleVideoInviteOpen();
    } else {
      this.handleVideoResponse(chatMsg);
    }
    return;
  } else if (chatMsg && (chatMsg.type === MESSAGE_TYPE.SCREEN_SHARE_SDP)) {
    this.logger(`Received SCREEN_SHARE_SDP message from ${chatMsg.from}.`);
    // TODO: what if we're already video chatting ...
    if (chatMsg.content.type === 'offer') {
      // Pops a dialog asking user if yes/no on video invite.
      //   - If yes, calls handleVideoOpen, which requires that chatMsg is
      //     assigned to a member (shitty way to pass it).
      //   - If no, calls handleVideoInviteClose, which should unassign the
      //     member, and ideally TODO, send a response to the invitee that
      //     there call was rejected.
      this.videoInviteChatMsg = chatMsg;
      // this.handleVideoInviteOpen();
      this.handleScreenShareInviteOpen();
    } else {
      // this.handleVideoResponse(chatMsg);
      this.handleScreenShareResponse(chatMsg);
    }
    return;
  } else if (chatMsg && (chatMsg.type === MESSAGE_TYPE.RECEIPT)) {
    this.logger(`Received RECEIPT message from ${chatMsg.from}.`);
    this.handleReceipt(chatMsg);
    return;
  }

  // TODO TODO TODO: Fix this workaround--suspect it'r reflected messaging bug
  //                 from the duplex peer manager.
  if (chatMsg && WORKAROUND__DISABLE_REFLECTED_PACKET) {
    const isSelf = (chatMsg.to === chatMsg.from);
    if (!isSelf) {
      if (chatMsg.from === this.props.userId) {
        // Discard handling this message for now.
        return;
      }
    }
  }

  const messages = [chatMsg];
  this.addIncomingMessage(messages);
  this.updateContactOrderAndStatus(messages);
  this.sendMessageReceipts(messages);
}

// SO MUCH TODO TODO TODO
//
// Callers include anywhere messages arrive or change state to read:
//    this.addIncomingMessage
//    initialization method
//    handleContactClick
//
export function sendMessageReceipts(theMessages) {
  if (!ENABLE_RECEIPTS) {
    return;
  }
  // Receipts structure:
  // {
  //   <from.id>: {
  //     recipient: <to.id/Me>,
  //     receivedMsgIds: [<msgId>, <msgId>, ...],
  //     readMsgIds: [<msgId>, <msgId>, ...],
  //   },
  //   ...
  // }
  //
  // TODO: build the receipts structure from theMessages, then sent it to
  //       the receipt dispatch method, which iterates over each object
  //       and sends it realtime or offline to the destination.
  const receipts = {};

  if (theMessages && theMessages.length > 0) {
    for (const message of theMessages) {
      const fromId = message.from;
      if (!(fromId in receipts)) {
        receipts[fromId] = {
          recipient: this.props.userId,
          receivedMsgIds: [],
          readMsgIds: [],
        };
      }

      if (message.msgState === MESSAGE_STATE.SEEN) {
        receipts[fromId].readMsgIds.push(message.id);
      } else {  // SENT_OFFLINE or SENT_REALTIME
        receipts[fromId].receivedMsgIds.push(message.id);
      }
    }

    this.dispatchMessageReceipts(receipts);
  }
}

export function dispatchMessageReceipts(theReceipts) {
  if (theReceipts) {
    for (const destId of Object.keys(theReceipts)) {
      const receipt = theReceipts[destId];
      const receiptMsg = new ChatMessage();
      receiptMsg.init(
          this.props.userId,
          destId,
          this._getNewMessageId(),
          receipt,
          Date.now(),
          MESSAGE_TYPE.RECEIPT
        );

      const destPublicKey = this.props.contactMgr.getPublicKey(destId);
      if (!destPublicKey) {
        this.logger(`ERROR: Unable to send receipts to ${destId}. No public key.`);
        continue;
      }

      if (this.peerMgr.isUserConnected(destId)) {
        this._sendOutgoingMessage(destId, receiptMsg, destPublicKey);
      } else {
        this._sendOutgoingMessageOffline(receiptMsg);
      }
    }
  }
}

export function handleReceipt(aChatMsg) {
  if (!ENABLE_RECEIPTS) {
    return;
  }

  if (aChatMsg.type !== MESSAGE_TYPE.RECEIPT) {
    this.logger('ERROR (MessagePage::handleReceipt): received non-receipt message.');
    return;
  }

  const receiptObj = aChatMsg.content;
  if (receiptObj) {
    this.logger(`Processing receipt from ${aChatMsg.from}`);
    const recipientId = receiptObj.recipient;
    const receivedMsgIds = receiptObj.receivedMsgIds;
    const readMsgIds = receiptObj.readMsgIds;

    //   1. mark message objects in the conversation manager appropriately.
    let needsSave = false;

    const receivedMsgs =
      this.conversations.getSpecificMessages(recipientId, receivedMsgIds);
    for (const receivedMsg of receivedMsgs) {
      if ((receivedMsg.msgState !== MESSAGE_STATE.SEEN) ||
          (receivedMsg.msgState !== MESSAGE_STATE.RECEIVED)) {
        needsSave = true;
        receivedMsg.msgState = MESSAGE_STATE.RECEIVED;
      }
    }

    const readMsgs =
      this.conversations.getSpecificMessages(recipientId, readMsgIds);
    for (const readMsg of readMsgs) {
      if (readMsg.msgState !== MESSAGE_STATE.SEEN) {
        needsSave = true;
        readMsg.msgState = MESSAGE_STATE.SEEN;
      }
    }

    if (needsSave) {
      this._writeConversations();

      const ac = this.props.contactMgr.getActiveContact();
      const needsMsgListUpdate = (recipientId === ac.id);
      if (needsMsgListUpdate) {
        const newMessages = this._getMessageArray(ac.id);
        this.props.storeMessages(newMessages);
      }
    }

    //   2. get the offline message service to delete any offline messages
    //      that have been read or received.
    let allMsgIds = [];
    if (receivedMsgIds) {
      allMsgIds = allMsgIds.concat(receivedMsgIds);
    }
    if (readMsgIds) {
      allMsgIds = allMsgIds.concat(readMsgIds);
    }
    const recipient = this.props.contactMgr.getContact(recipientId);
    this.offlineMsgSvc.deleteMessagesFromStorage(recipient, allMsgIds);
  }
}

export function sendRelayMessage(aChatMsg) {
  // Thoughts:
  //   * Autodiscovery is how people add to a relay.
  //     - if no autodiscovery for a user, consider the subscribe <id> command
  //       from a friend?
  //
  if (ENABLE_RELAY && isRelayId(aChatMsg.to)) {
    const msgContent = aChatMsg.content;
    if (msgContent === 'Relay: List Members') {
      const contactIds = this.props.contactMgr.getContactIds();
      let commandResponseMsg = `${this.props.userId} members: `;

      const length = contactIds.length;
      const lastContactIdx = length - 1;
      for (let idx = 0; idx < length; idx++) {
        const contactId = contactIds[idx];
        commandResponseMsg += `${contactId}`;
        if (idx !== lastContactIdx) {
          commandResponseMsg += ', ';
        }
      }

      const chatMsgTemplate = new ChatMessage();
      chatMsgTemplate.init(
        this.props.userId,
        undefined,
        this._getNewMessageId(),
        commandResponseMsg,
        Date.now());

      const commandDestinationIds = [ aChatMsg.from ]

      this.handleOutgoingRelayMessage(commandDestinationIds, chatMsgTemplate);

    } else if (msgContent === 'Relay: Unsubscribe') {
      // TODO: Send a confirmation message that we are unsubscribed.
    } else if (msgContent === 'Relay: Help') {
      // TODO: List the help commands.
    } else {
      // Relay:
      // Send the incoming message to all users except the sender.
      //
      const relayedMessage = `${aChatMsg.from} says:  ${aChatMsg.content}`;

      const chatMsgTemplate = new ChatMessage();
      chatMsgTemplate.init(
        this.props.userId,
        undefined,
        this._getNewMessageId(),
        relayedMessage,
        Date.now());

      const contactIds = this.props.contactMgr.getContactIds();
      const contactIdsMinusSender = contactIds.filter((contactId) => {
          return contactId !== aChatMsg.from;
        });

      // TODO: switch this back to contactIdsMinusSender (the immediate line below
      //       is only for debugging).
      // this.handleOutgoingRelayMessage(contactIds, chatMsgTemplate);
      this.handleOutgoingRelayMessage(contactIdsMinusSender, chatMsgTemplate);
    }
  }
}

export function addIncomingMessage(messages) {
  for (const message of messages) {
    this.conversations.addMessage(message);

    this.sendRelayMessage(message);
  }
  this._writeConversations();
}

export function updateContactOrderAndStatus(messages, writeContacts = true) {
  const contactMgr = new ContactManager();
  contactMgr.clone(this.props.contactMgr);

  let updateActiveMsgs = false;
  for (const idx in messages) {
    const message = messages[idx];
    const incomingId = message.from;

    // message.sent = true;

    const isLastOne = (idx === (messages.length - 1));
    const isActive = contactMgr.isActiveContactId(incomingId);

    contactMgr.setSummary(incomingId, message.content);

    if (isActive) {
      updateActiveMsgs = true;
      message.seen = true;
      message.msgState = MESSAGE_STATE.SEEN;
    } else {
      contactMgr.incrementUnread(incomingId);
      const count = contactMgr.getAllUnread()
      document.title = "(" + count + ") Stealthy | Decentralized Communication"
      notifyMe();
    }

    if (isLastOne) {
      contactMgr.moveContactToTop(incomingId);
    }
  }

  if (updateActiveMsgs) {
    const activeId = contactMgr.getActiveContact().id;
    const newMessages = this._getMessageArray(activeId);
    this.props.storeMessages(newMessages);
  }

  if (writeContacts) {
    this._writeContactList(contactMgr.getAllContacts());
  }

  this.props.storeContactMgr(contactMgr);
}

export function markReceivedMessagesSeen(aUserId) {
  let changesNeedSaving = false;
  const isSelf = (this.props.userId === aUserId);
  const chatMessages = this.conversations.getMessages(aUserId);

  const seenMessages = [];

  for (const chatMessage of chatMessages) {
    const received = (chatMessage.from !== this.props.userId) || isSelf;
    if (received && (chatMessage.msgState !== MESSAGE_STATE.SEEN)) {
      changesNeedSaving = true;
      chatMessage.seen = true;
      chatMessage.msgState = MESSAGE_STATE.SEEN;
      seenMessages.push(chatMessage);
    }
  }

  if (changesNeedSaving) {
    this._writeConversations();
  }

  return seenMessages;
}

export function handleContactClick(contact) {
  const selectedUserId = contact.id;

  // TODO: need to send a packet back indicating messages seen.
  //       need offline solution to this too.
  // Mark sent messages as seen.
  // const chatMessages = this.conversations.getMessages(selectedUserId);
  // for (const chatMsg of chatMessages) {
  //   if (chatMsg.sent) {
  //     chatMsg.seen = true;
  //   }
  // }

  // TODO: predicate this by checking if unread is already zero ...
  const contactMgr = new ContactManager();
  contactMgr.initFromArray(this.props.contactMgr.getAllContacts(), contact);
  contactMgr.clearUnread(selectedUserId);

  const seenMessages = this.markReceivedMessagesSeen(selectedUserId);
  this.sendMessageReceipts(seenMessages);

  const newMessages = this._getMessageArray(selectedUserId);

  this.props.storeContactMgr(contactMgr);
  this.props.storeMessages(newMessages);
  this.props.setContactSearch(false);
}

export function _sendOutgoingMessage(anOutgoingUserId, aChatMsg, aPublicKey) {
  aChatMsg.sent = true;
  aChatMsg.msgState = MESSAGE_STATE.SENT_REALTIME;
  const packet = (ENCRYPT_MESSAGES) ?
    utils.encryptObj(aPublicKey, aChatMsg) : JSON.stringify(aChatMsg);
  this.peerMgr.getConnection(anOutgoingUserId).send(packet);
}

export function _sendOutgoingMessageOffline(aChatMsg) {
  const outgoingUserId = aChatMsg.to;
  aChatMsg.msgState = MESSAGE_STATE.SENDING;
  const contact = this.props.contactMgr.getContact(outgoingUserId);
  this.offlineMsgSvc.sendMessage(contact, aChatMsg);
}


//
//  Audio / Video P2P
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
export function createAVPeer(stream, aMsgType = MESSAGE_TYPE.VIDEO_SDP) {
  const simplePeerOpts =
    getSimplePeerOpts(this.avPeerMgr.isInitiator(), { stream });
  const peerObj = SimplePeer(simplePeerOpts);
  this.avPeerMgr.setPeerObj(peerObj);

  peerObj.on('signal', (sdpData) => {
    this.logger('Video Peer Signal callback.');
    // TODO: this could probably be shared with handleOutgoingMessage in some ways.
    const outgoingId = this.avPeerMgr.getTargetId();
    const outgoingPublicKey =
      this.props.contactMgr.getPublicKey(outgoingId);

    const chatMsg = new ChatMessage();
    chatMsg.init(
      this.avPeerMgr.getUserId(),
       outgoingId,
      this._getNewMessageId(),
      sdpData,
      Date.now(),
      aMsgType);
    chatMsg.sent = true;

    const packet = (ENCRYPT_MESSAGES) ?
      utils.encryptObj(outgoingPublicKey, chatMsg) : JSON.stringify(chatMsg);

    this.logger(`Sending video invite request chatMsg to ${outgoingId}.`);
    this.peerMgr.getConnection(outgoingId).send(packet);
  });

  if (!(this.avPeerMgr.isSelf() && this.avPeerMgr.isInitiator())) {
    peerObj.on('stream', (stream) => {
      const video = document.querySelector('video');
      try {
        video.srcObject = stream;
      } catch (error) {
        video.src = window.URL.createObjectURL(stream);
      }
      video.play();
    });
  }

  if (!this.avPeerMgr.isInitiator()) {
    peerObj.signal(this.avPeerMgr.getSdpInvite());
  }

  peerObj.on('close', () => {
    this.logger('Closing Video / Audio p2p session.');
    this.handleVideoClose();
  });

  peerObj.on('error', (err) => {
    this.logger(`ERROR: Video / Audio p2p session. ${err}.`);
    this.anonalytics.aeAVWebRtcError(`${err}`)
    this.handleVideoClose();
  });
}

const SHARED_STREAM_TYPES = {
  VIDEO: 0,
  AUDIO: 1,
  DESKTOP: 2
}

export function _handleStreamShare(aStreamType) {
  utils.throwIfUndef('aStreamType', aStreamType);

  if (this.avPeerMgr) {
    this.logger('INFO(_handleStreamShare): Stream request ignored, session in progress.');
    return;
  }

  const targetId = this.props.contactMgr.getActiveContact().id;
  if (!this.peerMgr.isUserConnected(targetId)) {
    this.logger(`INFO(_handleStreamShare): Stream request ignored. Realtime connection to ${targetId} required.`);
    return;
  }

  if (!this.videoInviteChatMsg) {
    // TODO: need to error here if video is already open (can't be initiator and
    //       open video twice).

    // This happens if you are the initiator:
    this.avPeerMgr = new AVPeerMgr(this.props.userId, targetId, true);
    this._openMedia(aStreamType);
  } else {
    // This happens if you are the recipient
    this.handleVideoInvite(this.videoInviteChatMsg);
    this.videoInviteChatMsg = undefined;  // Clear for next time.
  }
}

export function handleShareDesktopOpen() {
  this._handleStreamShare(SHARED_STREAM_TYPES.DESKTOP);
  this.setState({ showShareDesktop: true });
}

export function handleVideoOpen() {
  this.anonalytics.aeVideoChatButton();
  this._handleStreamShare(SHARED_STREAM_TYPES.VIDEO);
  this.setState({ showVideoInvite: false });
}

export function handleShareDesktopClose() {
  this.setState({ showShareDesktop: false });
}

export function handleVideoInvite(aChatMsg) {
  if (this.avPeerMgr && this.avPeerMgr.isSelf()) {
    this.avPeerMgr.setInitiator(false);
    this.avPeerMgr.setSdpInvite(aChatMsg.content);
    this.createAVPeer(undefined);
  } else if (this.avPeerMgr && this.avPeerMgr.isInitiator()) {
    this.logger('INFO(handleVideoInvite): Video chat request ignored while video chat session is already being negotiated / in progress.');
  } else {
    this.avPeerMgr = new AVPeerMgr(this.props.userId, aChatMsg.from, false);
    this.avPeerMgr.setSdpInvite(aChatMsg.content);
    this._openMedia(SHARED_STREAM_TYPES.VIDEO);
  }
}

export function handleVideoResponse(aChatMsg) {
  this.avPeerMgr.setSdpResponse(aChatMsg.content);
  this.avPeerMgr.getPeerObjInitiator().signal(this.avPeerMgr.getSdpResponse());
}

export function handleVideoClose() {
  if (this.avPeerMgr) {
    this.avPeerMgr.close();
    this.avPeerMgr = undefined;
  }
  this.videoInviteChatMsg = undefined;  // Clear for next time.
  this.setState({ showVideo: false });
}

export function _startStreaming(theConstraints, aMsgType) {
  navigator.mediaDevices.getUserMedia(theConstraints)
  .then((stream) => {
    // Code to debug local (comment out code below it):
    //
    // this.setState({ showVideo: true });
    // const video = document.querySelector('video');
    // try {
    //   video.srcObject = stream;
    // } catch (error) {
    //   video.src = window.URL.createObjectURL(stream);
    // }
    // video.play();

    this.avPeerMgr.setStream(stream);
    this.createAVPeer(stream, aMsgType);
    this.setState({ showVideo: true });
  })
  .catch((error) => {
    this.handleVideoClose();
    this.logger(`ERROR: An error occured accessing media: ${error}`);
  });
}

export function _openMedia(aStreamType) {
  switch (aStreamType) {

    case SHARED_STREAM_TYPES.AUDIO:
      // TODO:
      break;

    case SHARED_STREAM_TYPES.VIDEO:
      const constraints = {
        video: true,
        audio: true
      }
      this._startStreaming(constraints, MESSAGE_TYPE.VIDEO_SDP);
      break;

    case SHARED_STREAM_TYPES.DESKTOP:
      // let res = requestScreenShare()

      getChromeExtensionStatus((status) => {
        this.logger(`INFO: Chrome extension status = ${status}`)
        switch (status) {
          case 'not-chrome':
          case 'installed-enabled':
            // Do nothing, run getScreenConstraints.
            break;
          case 'installed-disabled':
            let showMeThePlugin = confirm(
              "The Stealthy Screen Chrome Plugin must be enabled to share your desktop. " +
              "Would you like to do that now?");

            if (showMeThePlugin) {
              window.open('//chrome://extensions/?id=ololhidlkciconhglnndlojapdiklgha', '_blank');
            }
            this.handleVideoClose();
            return;
          case 'not-installed':
            let installThePlugin = confirm(
              "The Stealthy Screen Chrome Plugin must be installed to share your desktop. " +
              "Would you like to do that now?");

            if (installThePlugin) {
              window.open('https://chrome.google.com/webstore/detail/stealthy-screen/ololhidlkciconhglnndlojapdiklgha', '_blank');
            }
            this.handleVideoClose();
            return;
          default:

        }

        getScreenConstraints((error, screen_constraints) => {
          if (error) {
            this.handleVideoClose();
            return alert(error);
          }
          const constraints = {
            video: screen_constraints,
            // audio: true
          }
          // TODO: make this use screen share
          // this._startStreaming(constraints, MESSAGE_TYPE.SCREEN_SHARE_SDP);
          this._startStreaming(constraints, MESSAGE_TYPE.VIDEO_SDP);
        });
      });
      break;
    default:
      throw 'ERROR: unrecognized stream type for sharing.'
  }
}


//
//  I/O & Persistence
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
export function _writeContactList(aContactArr) {
  const contactsFileData = (ENCRYPT_CONTACTS) ?
    utils.encryptObj(this.publicKey, aContactArr) : aContactArr;
  this.io.writeLocalFile(this.props.userId, 'contacts.json', contactsFileData)
  .then(() => {
    if (this.props.showAdd) {
      this.handleAddClose();
    }
  });
}

export function _writeConversations() {
  this.conversations.storeContactBundles();
}

export function _writeSettings(settings) {
  if (settings === {} || settings === undefined) { settings = { time: Date.now() }; }
  const settingsData = (ENCRYPT_SETTINGS) ?
    utils.encryptObj(this.publicKey, settings) : settings;
  this.io.writeLocalFile(this.props.userId, 'settings.json', settingsData);
}


//
//  Miscellany
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//

export function _getMessageArrayForContact(aContact) {
  if (aContact) {
    return this._getMessageArray(aContact.id);
  }
  return [];
}

// This method transforms engine formatted messages to gui formatted ones. TODO:
// we should push this into the GUI or make the GUI work with the native format.
export function _getMessageArray(aRecipientId) {
  const recipient = this.props.contactMgr.getContact(aRecipientId);
  const recipientImageUrl = (recipient) ? recipient.image : undefined;

  const messages = [];

  const chatMessages = this.conversations.getMessages(aRecipientId);
  for (const chatMessage of chatMessages) {
    const isMe = (chatMessage.from === this.props.userId);
    const message = {
      me: isMe,
      image: (isMe ? this.props.avatarUrl : recipientImageUrl),
      author: (isMe ? this.props.userId : aRecipientId),
      body: chatMessage.content,
      delivered: chatMessage.sent,
      seen: chatMessage.seen,
      time: chatMessage.time,
      state: chatMessage.msgState,
    };
    messages.push(message);
  }

  return messages;
}

export function _getNewMessageId() {
  // Try this for now--it might be good enough.
  return Date.now();
}

export function _fetchPublicKey(aUserId) {
  return this.io.readRemoteFile(aUserId, 'pk.txt');
}
