/**
 *
 * MessagePage
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators, compose } from 'redux';

import {
  Dimmer,
  Divider,
  Modal,
  Header,
  Icon,
  Loader,
  Message,
  Segment,
} from 'semantic-ui-react';

import ToolBar from 'containers/ToolBar';
import ContactList from 'containers/ContactList';
import MessageList from 'containers/MessageList';

import ShareModal from 'components/ShareModal';
import IntroCarousel from 'components/IntroCarousel';
import SettingsModal from 'components/SettingsModal';
import VideoChatModal from 'components/VideoChatModal';
import VideoInviteModal from 'components/VideoInviteModal';
import AddContactModal from 'components/AddContactModal';
import TransactionModal from 'components/TransactionModal';
import DeleteContactModal from 'components/DeleteContactModal';

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import {
  makeSelectContactMgr,
  makeSelectMessagePage,
  makeSelectAddProfile,
  makeSelectShowAdd,
  makeSelectDefaultAdd,
  makeSelectScrollTop,
} from './selectors';
import {
  makeSelectPerson,
  makeSelectUserId,
  makeSelectUserData,
  makeSelectAvatarUrl,
} from '../BlockPage/selectors';
import {
  makeSelectPath,
  makeSelectWalletInfo,
  makeSelectContactArr,
} from '../ContactList/selectors';

import * as MessagePageCreators from './actions';
import * as MessagePageWorkers from './workers';
import reducer from './reducer';
import saga from './saga';
import getQueryString from 'utils/getQueryString';

const { PeerManager } = require('./../../network/PeerManager.js');
const { ContactManager } = require('./../../contactManager.js');

const { getPublicKeyFromPrivate } = require('blockstack');

const Config = require('Config');

class Timer {
  constructor(anEventName) {
    this.startTime = Date.now();
    this.events = [];

    const evt = {
      eventName: anEventName,
      time: 0
    }

    this.events.push(evt);
  }

  logEvent(anEventName) {
    const elapsedTime = Date.now() - this.startTime;
    const evt = {
      eventName: anEventName,
      time: elapsedTime,
    }
    this.events.push(evt);
  }

  getEvents() {
    let evtStr =  'Time (ms):\t\t\tEvent Name\n';
        evtStr += '-------------------------------------\n';
    for (const idx in this.events) {
      if (idx !== 0) {
        const evtData = this.events[idx];
        evtStr += `${evtData.time}:\t\t\t${evtData.eventName}\n`;
      }
    }
    evtStr += '\n';

    return evtStr;
  }
}

export class MessagePage extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.myTimer = new Timer('Enter MessagePage Ctor');

    this.state = {
      initWithFetchedData: false,
      console: false,
      search: true,
      discovery: true,
      webrtc: true,
      showIntro: false,
      showSettings: false,
      showVideo: false,
      showDelete: false,
      showShare: false,
      showInfo: false,
      showTransaction: false,
      showVideoInvite: false,
      showShareDesktop: false,
      contactArr: [],
    };

    this.delayedBinding();

    this.conversations = undefined;
    this.offlineMsgSvc = undefined;
    this.sdpManager = undefined;
    this.connectionManager = undefined;
    this.invitePolling = undefined;
    this.peerMgr = new PeerManager(this.logger);
    this.invitations = [];   // TODO: Should probably be a Set (unique elements)
    this.publicKey = undefined;
    this.privateKey = undefined;
    this.io = undefined;
    this.heartBeat = undefined;
    this.avPeerMgr = undefined;
    this.shuttingDown = false;
    this.videoInviteChatMsg = undefined;
    this.anonalytics = undefined;

    const { userData } = this.props;
    if (userData) {
      this.privateKey = userData.appPrivateKey;
      this.publicKey = getPublicKeyFromPrivate(this.privateKey);

      this.setupDevelopmentConstants();
    }
  }

  delayedBinding = () => {
    this.componentDidMountWork = MessagePageWorkers.componentDidMountWork.bind(this);
    this.componentWillUnmountWork = MessagePageWorkers.componentWillUnmountWork.bind(this);
    this.shutdown = MessagePageWorkers.shutdown.bind(this);
    this.startWebRtc = MessagePageWorkers.startWebRtc.bind(this);
    this.stopWebRtc = MessagePageWorkers.stopWebRtc.bind(this);
    this.setupDevelopmentConstants = MessagePageWorkers.setupDevelopmentConstants.bind(this);
    this._initWithContacts = MessagePageWorkers._initWithContacts.bind(this);
    this._fetchUserSettings = MessagePageWorkers._fetchUserSettings.bind(this);
    this._fetchDataAndCompleteInit = MessagePageWorkers._fetchDataAndCompleteInit.bind(this);
    this._initSettings = MessagePageWorkers._initSettings.bind(this);
    this.handleRadio = MessagePageWorkers.handleRadio.bind(this);
    this.handleDeleteContact = MessagePageWorkers.handleDeleteContact.bind(this);
    this.handleSearchSelect = MessagePageWorkers.handleSearchSelect.bind(this);
    this.handleNewConnection = MessagePageWorkers.handleNewConnection.bind(this);
    this.handleCloseConnection = MessagePageWorkers.handleCloseConnection.bind(this);
    this._handleHeartBeatMonitor = MessagePageWorkers._handleHeartBeatMonitor.bind(this);
    this._inviteUserToChat = MessagePageWorkers._inviteUserToChat.bind(this);
    this._initAndLaunchSdpInvitePolling = MessagePageWorkers._initAndLaunchSdpInvitePolling.bind(this);
    this._handleSdpInvite = MessagePageWorkers._handleSdpInvite.bind(this);
    this._initiateSdpResponse = MessagePageWorkers._initiateSdpResponse.bind(this);
    this.handleOutgoingMessage = MessagePageWorkers.handleOutgoingMessage.bind(this);
    this.handleOutgoingRelayMessage = MessagePageWorkers.handleOutgoingRelayMessage.bind(this);
    this.handleIncomingMessage = MessagePageWorkers.handleIncomingMessage.bind(this);
    this.sendMessageReceipts = MessagePageWorkers.sendMessageReceipts.bind(this);
    this.dispatchMessageReceipts = MessagePageWorkers.dispatchMessageReceipts.bind(this);
    this.handleReceipt = MessagePageWorkers.handleReceipt.bind(this);
    this.sendRelayMessage = MessagePageWorkers.sendRelayMessage.bind(this);
    this.addIncomingMessage = MessagePageWorkers.addIncomingMessage.bind(this);
    this.updateContactOrderAndStatus = MessagePageWorkers.updateContactOrderAndStatus.bind(this);
    this.markReceivedMessagesSeen = MessagePageWorkers.markReceivedMessagesSeen.bind(this);
    this.handleContactClick = MessagePageWorkers.handleContactClick.bind(this);
    this._sendOutgoingMessage = MessagePageWorkers._sendOutgoingMessage.bind(this);
    this._sendOutgoingMessageOffline = MessagePageWorkers._sendOutgoingMessageOffline.bind(this);
    this.createAVPeer = MessagePageWorkers.createAVPeer.bind(this);
    this.handleShareDesktopOpen = MessagePageWorkers.handleShareDesktopOpen.bind(this);
    this.handleShareDesktopClose = MessagePageWorkers.handleShareDesktopClose.bind(this);
    this.handleVideoOpen = MessagePageWorkers.handleVideoOpen.bind(this);
    this.handleVideoInvite = MessagePageWorkers.handleVideoInvite.bind(this);
    this.handleVideoResponse = MessagePageWorkers.handleVideoResponse.bind(this);
    this.handleVideoClose = MessagePageWorkers.handleVideoClose.bind(this);
    this._openMedia = MessagePageWorkers._openMedia.bind(this);
    this._handleStreamShare = MessagePageWorkers._handleStreamShare.bind(this);
    this._startStreaming = MessagePageWorkers._startStreaming.bind(this);
    this._writeContactList = MessagePageWorkers._writeContactList.bind(this);
    this._writeConversations = MessagePageWorkers._writeConversations.bind(this);
    this._writeSettings = MessagePageWorkers._writeSettings.bind(this);
    this._getMessageArrayForContact = MessagePageWorkers._getMessageArrayForContact.bind(this);
    this._getMessageArray = MessagePageWorkers._getMessageArray.bind(this);
    this._getNewMessageId = MessagePageWorkers._getNewMessageId.bind(this);
    this._fetchPublicKey = MessagePageWorkers._fetchPublicKey.bind(this);
    this._updateContactPubKeys = MessagePageWorkers._updateContactPubKeys.bind(this);
    this.readContactDiscovery = MessagePageWorkers.readContactDiscovery.bind(this);
    this.writeContactDiscovery = MessagePageWorkers.writeContactDiscovery.bind(this);
    this.handleContactAdd = MessagePageWorkers.handleContactAdd.bind(this);
  }


  //
  //  React Component Callbacks
  // ////////////////////////////////////////////////////////////////////////////
  // ////////////////////////////////////////////////////////////////////////////
  //
  componentWillReceiveProps(nextProps) {
    if (nextProps.contactArr.length && (nextProps.contactArr.length !== this.state.contactArr.length)) {
      this.setState({ contactArr: nextProps.contactArr });
      this.handleContactAdd(nextProps.contactArr[0], nextProps.contactArr[0].id, 'pending');
    }
    if (nextProps.defaultAdd) {
      this.handleSearchSelect(nextProps.profile)
    }
  }

  componentDidMount() {
    this.componentDidMountWork();

    if (process.env.NODE_ENV === 'production' && !this.props.plugin) {
      window.onbeforeunload = (e) => {
        // TODO: add check for is dirty here before popping this.
        // debugger
        this.shutdown();
        // if (not Dirty) {
        // return
        // }

        return e.returnValue;
      };
    }
  }

  componentWillUnmount() {
    this.componentWillUnmountWork();
  }

  log = (display, ...args) => {
    if (display) {
      this.logger(...args);
    }
  }

  logger = (...args) => {
    if (process.env.NODE_ENV === 'development' || this.state.console) {
      console.log(...args);
    }
  }

  render() {
    const { contactMgr } = this.props;
    const length = getQueryString('length');
    const dimmerLogic = (this.props.person && !this.state.initWithFetchedData);
    return (this.props.plugin) ? (length > 0) ? (
      <div
        id="messagePagePlugin"
        style={{ height: '100vh',
          width: '100vw',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding:0
        }}
      >
        <VideoChatModal
          open={this.state.showVideo}
          close={this.handleVideoClose}
        />
        <VideoInviteModal
          activeContact={contactMgr.getActiveContact()}
          handleVideoOpen={this.handleVideoOpen}
          handleVideoInviteClose={this.handleVideoInviteClose}
          showVideoInvite={this.state.showVideoInvite}
        />
        <Dimmer active={dimmerLogic} page>
          <Loader size="big" content="Initializing your data..." />
        </Dimmer>
        <Segment
          compact basic
          id="messageListSegment"
          textAlign="left"
          style={{ flex: '1 1 100%',
            height: '100%' }}
        >
          <MessageList
            logger={this.logger}
            plugin={this.props.plugin}
            handleSearchSelect={this.handleSearchSelect}
            slowSearch={this.state.search}
            handleContactClick={this.handleContactClick}
            updateContactPubKeys={this._updateContactPubKeys}
            setMsgScrollTop={this.props.setMsgScrollTop}
            handleShareOpen={this.handleShareOpen}
            handleVideoOpen={this.handleVideoOpen}
            handleDeleteOpen={this.handleDeleteOpen}
            handleNewMessage={this.handleOutgoingMessage}
          />
        </Segment>
      </div>
    ) : (
      <Modal
        open={true}
        basic
        size="tiny"
      >
        <Header icon="address card outline" as='h2' content="No Contacts Found" />
        <Icon />
        <Modal.Content>
          <h4>Please add contacts if you'd like to chat.</h4>
        </Modal.Content>
      </Modal>
    ) : (
      <div id="messagePage">
        <SettingsModal
          handleRadio={this.handleRadio}
          open={this.state.showSettings}
          close={this.handleSettingsClose}
          logger={this.logger}
          buildDate={Config.BUILD_DATE_STAMP}
          buildTime={Config.BUILD_TIME_STAMP}
          buildVersion={Config.BUILD_VERSION}
          search={this.state.search}
          discovery={this.state.discovery}
          webrtc={this.state.webrtc}
          sConsole={this.state.console}
        />
        <IntroCarousel
          open={this.state.showIntro}
          close={this.handleIntroClose}
          openSettings={this.handleSettingsOpen}
          writeSettings={this._writeSettings}
          initSettings={this._initSettings}
          anonalytics={this.anonalytics}
        />
        <VideoChatModal
          open={this.state.showVideo}
          close={this.handleVideoClose}
        />
        <VideoInviteModal
          activeContact={contactMgr.getActiveContact()}
          handleVideoOpen={this.handleVideoOpen}
          handleVideoInviteClose={this.handleVideoInviteClose}
          showVideoInvite={this.state.showVideoInvite}
        />
        <ShareModal
          userId={this.props.userId}
          activeId={contactMgr.getActiveContact()}
          showShare={this.state.showShare}
          handleShareClose={this.handleShareClose}
        />
        <AddContactModal
          showAdd={this.props.showAdd}
          addContact={this.handleAddContact}
          handleAddClose={this.handleAddClose}
          addContactInfo={this.props.profile}
        />
        <DeleteContactModal
          showDelete={this.state.showDelete}
          deleteContact={this.handleDeleteContact}
          handleDeleteClose={this.handleDeleteClose}
          activeContact={contactMgr.getActiveContact()}
        />
        <Dimmer active={dimmerLogic} page>
          <Loader size="big" content="Initializing your data..." />
        </Dimmer>
        <Segment.Group
          style={{ height: '100vh',
            width: '100vw',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column' }}
        >
          <ToolBar
            userData={this.props.userData}
            addNewContactClick={this.addNewContactClick}
            handleSignOut={this.props.handleSignOut}
            handleSettingsOpen={this.handleSettingsOpen}
            handleInfoOpen={this.handleInfoOpen}
            logger={this.logger}
            startTour={this.props.startTour}
            updateSteps={this.props.updateSteps}
          />
          <Segment.Group
            horizontal
            style={{ flex: '1 1 100%' }}
          >
            <ContactList
              handleContactClick={this.handleContactClick}
              logger={this.logger}
            />
            <Segment compact basic textAlign="left">
              <MessageList
                logger={this.logger}
                userData={this.props.userData}
                handleSearchSelect={this.handleSearchSelect}
                slowSearch={this.state.search}
                updateContactPubKeys={this._updateContactPubKeys}
                setMsgScrollTop={this.props.setMsgScrollTop}
                handleShareOpen={this.handleShareOpen}
                handleVideoOpen={this.handleVideoOpen}
                handleDeleteOpen={this.handleDeleteOpen}
                handleNewMessage={this.handleOutgoingMessage}
                handleShareDesktopOpen={this.handleShareDesktopOpen}
                handleShareDesktopClose={this.handleShareDesktopClose}
              />
            </Segment>
          </Segment.Group>
        </Segment.Group>
      </div>
    );
  }


//
//  TODO: Prabhaav, help me sort these functions to the right areas in this file
// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////
//
  handleAddContact = () => {
    if (this.props.profile) { this.handleSearchSelect(this.props.profile); }
  }
  handleAddClose = () => {
    this.props.setShowAdd(false);
  }
  handleVideoInviteOpen = () => this.setState({ showVideoInvite: true })
  handleVideoInviteClose = () => {
    this.videoInviteChatMsg = undefined;
    this.setState({ showVideoInvite: false });
  }
  handleShareOpen = () => this.setState({ showShare: true })
  handleShareClose = () => this.setState({ showShare: false })
  handleDeleteOpen = () => this.setState({ showDelete: true })
  handleDeleteClose = () => this.setState({ showDelete: false })
  handleTransactionOpen = () => this.setState({ showTransaction: true })
  handleTransactionClose = () => this.setState({ showTransaction: false })
  addNewContactClick = () => {
    this.anonalytics.aeContactsSearched();
    this.props.storeMessages([]);
    this.props.setContactSearch(true);
  }
  handleSettingsOpen = () => {
    this.setState({ showSettings: true });
  }
  handleSettingsClose = () => {
    this.setState({ showSettings: false });
  }
  handleIntroOpen = () => {
    this.setState({ showIntro: true });
  }
  handleIntroClose = () => {
    this.setState({ showIntro: false });
    this.props.updateSteps({
      title: 'Active Contact',
      text: 'Here you can see contact\'s profile, remove them, or video chat',
      selector: '.activeContact',
      position: 'top-right',
      style: {
        mainColor: '#a350f0',
        beacon: {
          inner: '#a350f0',
          outer: '#a350f0',
        },
      },
    });
    this.props.startTour();
  }
  handleInfoOpen = () => {
    this.setState({ showInfo: true });
  }
  handleInfoClose = () => {
    this.setState({ showInfo: false });
  }
}

MessagePage.propTypes = {
  person: PropTypes.object,
  userData: PropTypes.object,
  storeContactMgr: PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  person: makeSelectPerson(),
  userData: makeSelectUserData(),
  userId: makeSelectUserId(),
  avatarUrl: makeSelectAvatarUrl(),
  contactMgr: makeSelectContactMgr(),
  messagepage: makeSelectMessagePage(),
  profile: makeSelectAddProfile(),
  showAdd: makeSelectShowAdd(),
  defaultAdd: makeSelectDefaultAdd(),
  scrollTop: makeSelectScrollTop(),
  walletInfo: makeSelectWalletInfo(),
  contactArr: makeSelectContactArr(),
  path: makeSelectPath(),
});

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(MessagePageCreators, dispatch);
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'messagePage', reducer });
const withSaga = injectSaga({ key: 'messagePage', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(MessagePage);
