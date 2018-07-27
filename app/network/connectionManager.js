const Peer = require('simple-peer');
const { encryptECIES } = require('blockstack/lib/encryption');
const { RESPONSE_TYPE, OFFER_TYPE } = require('./PeerManager');
const { getSimplePeerOpts } = require('./utils.js');

const sdpParser = require('sdp-transform');

const ENABLE_FAILED_ICE_REJECTION = true;

class ConnectionManager {
  constructor(logger, sdpManager, theAnonalytics,
              connectionHandler, dataHandler, closeHandler) {
    this.logger = logger;
    this.sdpManager = sdpManager;
    this.anonalytics = theAnonalytics;

    this.connectionHandler = connectionHandler;
    this.dataHandler = dataHandler;
    this.closeHandler = closeHandler;

    this.failedSdpInvites = {};
  }

  invite(targetUser, targetUserPublicKey = undefined) {
    const p = new Peer(getSimplePeerOpts());

    p.on('signal', (data) => {
      this.logger(`Peer signal with ${targetUser}`);
      // TODO: something less ugly for encryption
      const outgoingSignalData = (targetUserPublicKey) ?
        JSON.stringify(encryptECIES(targetUserPublicKey, JSON.stringify(data))) :
        data;
      this.sdpManager.writeSdpInvite(targetUser, outgoingSignalData);
    });

    p.on('connect', () => {
      this.logger(`connected to ${targetUser}`);
      this.sdpManager.deleteSdpInvite(targetUser);
      this.connectionHandler(targetUser, OFFER_TYPE);
    });

    p.on('data', (data) => {
      const rxText = data.toString('utf8');
      this.logger('data: ', rxText);
      this.dataHandler(targetUser, rxText);
    });

    p.on('close', () => {
      this.logger(`Connection(invite) to ${targetUser} closed!`);
      this.closeHandler(targetUser, OFFER_TYPE);
    });

    p.on('error', (err) => {
      this.logger(`Error(invite) in connection to ${targetUser}`);
      this.logger(err);
      this.anonalytics.aeChatWebRtcError(`invite:${err}`);
    });

    return p;
  }

  respond(sdpInvite, targetUser, targetUserPublicKey = undefined) {
    const sdpJsonObj = sdpParser.parse(sdpInvite.sdp);
    const sessionId = sdpJsonObj.origin.sessionId;
    if (this.failedSdpInvites[targetUser] &&
        this.failedSdpInvites[targetUser].includes(sessionId)) {
      this.logger(`Ignoring failed sdp invite from ${targetUser} (sessionId = ${sessionId}).`);
      return undefined;
    }

    const p = new Peer(getSimplePeerOpts(false));

    p.on('signal', (data) => {
      this.logger(`Peer signal with ${targetUser}`);
      // TODO: something less ugly for encryption
      const outgoingSignalData = (targetUserPublicKey) ?
        JSON.stringify(encryptECIES(targetUserPublicKey, JSON.stringify(data))) :
        data;
      this.sdpManager.writeSdpResponse(targetUser, outgoingSignalData);
    });

    p.signal(sdpInvite);

    p.on('connect', () => {
      this.logger(`connected to ${targetUser}`);
      this.sdpManager.deleteSdpResponse(targetUser);
      this.connectionHandler(targetUser, RESPONSE_TYPE);
    });

    p.on('data', (data) => {
      const rxText = data.toString('utf8');
      this.logger('data: ', rxText);
      this.dataHandler(targetUser, rxText);
    });

    p.on('close', () => {
      this.logger(`Connection(respond) to ${targetUser} closed!`);
      this.closeHandler(targetUser, RESPONSE_TYPE);
    });

    p.on('error', (err) => {
      this.logger(`Error(respond) in connection to ${targetUser}`);
      this.logger(err);
      this.anonalytics.aeChatWebRtcError(`respond:${err}`);
      if (ENABLE_FAILED_ICE_REJECTION) {
        if (!(targetUser in this.failedSdpInvites)) {
          this.failedSdpInvites[targetUser] = [];
        }
        this.failedSdpInvites[targetUser].push(sessionId);
      }
    });

    return p;
  }
}

module.exports = { ConnectionManager };
