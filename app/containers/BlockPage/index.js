/**
 *
 * BlockPage
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators, compose } from 'redux';
import Joyride from 'react-joyride';

import {
  Button,
  Dimmer,
  Loader,
  Grid,
  Header,
  Icon,
  Image,
  Message,
  Modal,
  Responsive,
  Segment,
} from 'semantic-ui-react';

import update from 'immutability-helper';
import {
  makeSelectPerson,
  makeSelectUserData,
  makeSelectIsSignedIn,
} from './selectors';

import UserIdForm from 'containers/UserIdForm';
import MessagePage from 'containers/MessagePage';
import HomePageLayout from 'components/HomePageLayout';

import request from 'utils/request';
import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import getQueryString from 'utils/getQueryString';
import * as BlockActionCreators from './actions';
import reducer from './reducer';
import saga from './saga';

import '../../../node_modules/react-joyride/lib/react-joyride-compiled.css';

const blockstack = require('blockstack');
const platform = require('platform');
const Config = require('Config');

const firebase = require('firebase');
const utils = require('../../utils.js');
const common = require('../../utils/common.js');
const { Anonalytics } = require('../../utils/anonalytics.js');

const myDelay = 10800000;
let delay = 5000;
let start = Date.now();

export class BlockPage extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    const isSignedIn = this.checkSignedInStatus();
    const userData = isSignedIn && this.loadUserData();
    const person = (userData.username) ? new blockstack.Person(userData.profile) : false;
    this.props.storeBlockData(userData, person, isSignedIn);

    this.state = {
      userData,
      person,
      isSignedIn,
      joyrideOverlay: true,
      joyrideType: 'continuous',
      isReady: false,
      isMobile: false,
      isRunning: false,
      stepIndex: 0,
      steps: [],
      selector: '',
      visible: false,
      msgVisible: true,
      showSessionBlock: false,
    };

    const appToken = getQueryString('app');
    let context = utils.getAppContext(appToken);
    this.plugin = (context !== 'Stealthy');

    this.anonalytics = new Anonalytics();
    this.anonalytics.aeReferral(document.referrer);
    this.anonalytics.aeVisitContext(context);

    if (!firebase.auth().currentUser) {
      firebase.auth().signInAnonymously()
      .then(() => {
        this.anonalytics.setDatabase(firebase);
      });
    }
    this.ref = undefined;
    this.publicKey = '';
  }
  componentDidMount() {
    if (process.env.NODE_ENV === 'production') {
      this.startTimer();
    }
  }
  componentWillReceiveProps (nextProps) {
    const { userData, isSignedIn } = nextProps
    if (userData && !this.ref) {
      const { appPrivateKey } = userData
      this.publicKey = blockstack.getPublicKeyFromPrivate(appPrivateKey);
      const sessionRef = common.getRootRef(this.publicKey)
      this.ref = firebase.database().ref(sessionRef)
      this.ref.on('child_changed', (childSnapshot, prevChildKey) => {
        const session = childSnapshot.val()
        if (session !== common.getSessionId() && session !== 'none') {
          this.handleSignOut()
          this.ref.off();
        }
      });
      this.handleSessionManagment()
    }
  }
  componentWillUnmount () {
    if (this.ref) {
      this.ref.off();
    }
  }
  unlockSession = async () => {
    await firebase.database().ref(common.getSessionRef(this.publicKey)).set(common.getSessionId())
    this.setState({showSessionBlock: false});
  }
  handleSessionManagment = async () => {
    const ref = firebase.database().ref(common.getSessionRef(this.publicKey));
    await ref.once('value')
    .then((snapshot) => {
      if (!snapshot.exists() || snapshot.val() === 'none') {
        ref.set(common.getSessionId());
      }
      else {
        this.setState({showSessionBlock: true});
      }
    })
  }
  updateCheck = () => {
    request('https://www.stealthy.im/appversion.json')
    .then((data) => {
      const buildVersion = data.version;
      const currentVersion = Config.BUILD_VERSION;
      // const currentVersion = {major: 0, minor: 5, patch: 0}
      if ((buildVersion.major != currentVersion.major) ||
          (buildVersion.minor != currentVersion.minor) ||
          (buildVersion.patch != currentVersion.patch)) {
        this.setState({ visible: true });
      }
    })
    .catch((error) => {
      console.log('Build version check error');
    });
  }
  handleDismiss = () => this.setState({ visible: false })
  startTimer = () => {
    setTimeout(() => {
      // your code here...
      // calculate the actual number of ms since last time
      const actual = Date.now() - start;
      // subtract any extra ms from the delay for the next cycle
      delay = myDelay - (actual - myDelay);
      start = Date.now();
      // start the timer again
      this.startTimer();
      if (process.env.NODE_ENV === 'production') { this.updateCheck(); }
    }, delay);
  }
  checkSignedInStatus() {
    if (blockstack.isUserSignedIn()) {
      return true;
    } else if (blockstack.isSignInPending()) {
      blockstack.handlePendingSignIn().then(() => {
        window.location = window.location.origin;
      });
      return false;
    }
    return false;
  }
  loadUserData() {
    return blockstack.loadUserData();
  }
  handleLogIn = (event) => {
    this.anonalytics.aeLoginWithBlockstack();
    this.handleSignIn(event);
  }
  handleCreateAccount = (event) => {
    this.anonalytics.aeCreateAccount();
    this.handleSignIn(event);
  }
  handleSignIn = (event) => {
    const { product } = platform;
    if (product) {
      this.setState({ isMobile: true });
    } else {
      event.preventDefault();
      const origin = window.location.origin;
      blockstack.redirectToSignIn(origin, `${origin}/manifest.json`, ['store_write', 'publish_data']);
    }
  }
  handleSignOut = (event) => {
    if (event) event.preventDefault();
    firebase.database().ref(common.getSessionRef(this.publicKey)).set(common.NO_SESSION)
    blockstack.signUserOut(window.location.href);
  }
  startTour = () => {
    this.joyride.reset(true);
  }
  addSteps = (steps) => {
    let newSteps = steps;
    if (!Array.isArray(newSteps)) {
      newSteps = [newSteps];
    }
    if (!newSteps.length) {
      return;
    }
    // Force setState to be synchronous to keep step order.
    this.setState((currentState) => {
      currentState.steps = currentState.steps.concat(newSteps);
      return currentState;
    });
  }
  updateSteps = (step) => {
    const newSteps = update(this.state.steps, { $splice: [[1, 1, step]] });  // array.splice(start, deleteCount, item1)
    this.setState({ steps: newSteps });
  }
  addTooltip = (data) => {
    this.joyride.addTooltip(data);
  }
  next = () => {
    this.joyride.next();
  }
  callback = (data) => {
    this.setState({
      selector: data.type === 'tooltip:before' ? data.step.selector : '',
    });
  }
  onClickSwitch = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    const state = {};

    if (el.dataset.key === 'joyrideType') {
      this.joyride.reset();

      this.setState({
        isRunning: false,
      });

      setTimeout(() => {
        this.setState({
          isRunning: true,
        });
      }, 300);

      state.joyrideType = e.currentTarget.dataset.type;
    }

    if (el.dataset.key === 'joyrideOverlay') {
      state.joyrideOverlay = el.dataset.type === 'active';
    }

    this.setState(state);
  }
  handleMsgDismiss = () => this.setState({ msgVisible: false })
  handleMobileDismiss = () => this.setState({ isMobile: false })
  render() {
    const {
      isMobile,
      isReady,
      isRunning,
      isSignedIn,
      joyrideOverlay,
      joyrideType,
      msgVisible,
      person,
      selector,
      stepIndex,
      steps,
      userData,
    } = this.state;
    const { product, name } = platform;
    const queryRef = getQueryString('ref');
    const maxWidth = (this.plugin) ? 200 : 600;
    const gridStyle = (this.plugin) ? {margin:'0px'} : {};
    const safariError = (name === 'Safari' && msgVisible) ? (
      <Modal size="small" open>
        <Message icon onDismiss={this.handleMsgDismiss}>
          <Icon name="announcement" />
          <Message.Content>
            <Message.Header>Development in progress...</Message.Header>
            Stealthy is not fully supported for Safari. Some features such as video chat will not work properly. Please use either Firefox or Chrome.
          </Message.Content>
        </Message>
      </Modal>
    ) : null;
    const joyRideElement = (this.plugin) ?
      '' :
      (<Joyride
        ref={(c) => (this.joyride = c)}
        callback={this.callback}
        debug={false}
        disableOverlay={selector === '.card-tickets'}
        locale={{
          back: (<span>Back</span>),
          close: (<span>Close</span>),
          last: (<span>Finish</span>),
          next: (<span>Next</span>),
          skip: (<span>Skip</span>),
        }}
        run={isRunning}
        showOverlay={joyrideOverlay}
        showSkipButton
        showStepsProgress
        stepIndex={stepIndex}
        steps={steps}
        type={joyrideType}
      />);
    return (isMobile) ? (
      <Modal basic size="tiny" open closeIcon onClose={this.handleMobileDismiss}>
        <Header icon="mobile" content="Blockstack Mobile Support Coming Soon" />
        <Modal.Content>
          <Icon />More Info: <a href="https://blockstack.org/roadmap" target="_blank">https://blockstack.org/roadmap</a>
        </Modal.Content>
      </Modal>
    ) : (!person && isSignedIn) ? (
      <UserIdForm analytics={this.anonalytics} handleSignOut={this.handleSignOut} userData={userData} />
    ) : (!isSignedIn) ? (
      <div>
        <HomePageLayout
          plugin={this.plugin}
          product={product}
          queryRef={queryRef}
          handleSignIn={this.handleSignIn}
          handleLogIn={this.handleLogIn}
          handleCreateAccount={this.handleCreateAccount}
        />
      </div>
    ) : (
      <Grid style={gridStyle}>
        <Responsive maxWidth={maxWidth}>
          <Modal dimmer="blurring" size="tiny" open>
            <Message icon>
              <Icon name="resize horizontal" />
              <Message.Content>
                <Message.Header>Minimum Screen Size Warning</Message.Header>
                Stealthy is not optimized to work on smaller screens.
              </Message.Content>
            </Message>
          </Modal>
        </Responsive>
        {joyRideElement}
        <Modal
          open={this.state.visible}
          basic
          size="tiny"
        >
          <Header icon="download" content="Stealthy Update Available" />
          <Modal.Content>
            <h3>Please reload your page to update your build.</h3>
          </Modal.Content>
          <Modal.Actions>
            <Button color="red" onClick={this.handleDismiss} inverted>
              <Icon name="close" /> Dismiss
            </Button>
            <Button color="green" onClick={() => window.location.reload(true)} inverted>
              <Icon name="download" /> Update
            </Button>
          </Modal.Actions>
        </Modal>
        {/*<Modal
          open={this.state.showSessionBlock}
          basic
          size="tiny"
        >
          <Header icon="warning circle" content="Stealthy Session Locked" />
          <Modal.Content>
            <h3>Stealthy is only supported on one platform currently.</h3>
          </Modal.Content>
          <Modal.Actions>
            <Button color="red" onClick={this.unlockSession} inverted>
              <Icon name="unlock" /> Force Unlock
            </Button>
            <Button color="green" onClick={this.handleSignOut} inverted>
              <Icon name="sign out" /> Logout
            </Button>
          </Modal.Actions>
        </Modal>*/}
        {safariError}
        <MessagePage
          userData={this.state.userData}
          startTour={this.startTour}
          next={this.next}
          updateSteps={this.updateSteps}
          addSteps={this.addSteps}
          handleSignOut={this.handleSignOut}
          plugin={this.plugin}
        />
      </Grid>
    );
  }
}

BlockPage.propTypes = {
  storeBlockData: PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  person: makeSelectPerson(),
  userData: makeSelectUserData(),
  isSignedIn: makeSelectIsSignedIn(),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(BlockActionCreators, dispatch);
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'blockPage', reducer });
const withSaga = injectSaga({ key: 'blockPage', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(BlockPage);
