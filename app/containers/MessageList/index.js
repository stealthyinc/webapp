/**
 *
 * MessageList
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators, compose } from 'redux';
import _ from 'lodash';
import BMessage from 'components/Message';
import MessageForm from 'components/MessageForm';

import {
  Button,
  Card,
  Dimmer,
  Divider,
  Dropdown,
  Form,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Message,
  Modal,
  Popup,
  Search,
  Segment,
  Sidebar,
} from 'semantic-ui-react';

import Dropzone from 'react-dropzone';

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import {
  makeSelectUsername,
  makeSelectLoading,
  makeSelectError,
  makeSelectMessages,
  makeSelectNewContactSearch,
  makeSelectMessageList,
} from './selectors';
import {
  makeSelectProfiles,
  makeSelectWalletInfo,
  makeSelectPublicProfile,
} from '../ContactList/selectors';
import {
  makeSelectContactMgr,
} from '../MessagePage/selectors';
import {
  makeSelectUserId,
  makeSelectPerson,
  makeSelectUserData,
  makeSelectAvatarUrl,
} from '../BlockPage/selectors';
import * as MessageListCreators from './actions';
import reducer from './reducer';
import saga from './saga';

import {
  onDrop,
  getSocial,
  getBase64,
  handleFormSubmit,
  handleResultSelect,
  handleSearchChange,
  getBitCoinWallets,
} from './workers';

const constants = require('./../../constants.js');
const statusIndicators = constants.statusIndicators;
const platform = require('platform');

export class MessageList extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      activeContact: undefined,
      userOfflineError: false,
      status: '',
      value: '',
    };
    this.onDrop = onDrop.bind(this);
    this.getBase64 = getBase64.bind(this);
    this.handleFormSubmit = handleFormSubmit.bind(this);
    this.handleSearchChange = handleSearchChange.bind(this);
    this.handleResultSelect = handleResultSelect.bind(this);
    this.contactsArr = []
    this.contacts = []
  }
  componentWillMount() {
    this.props.resetContactSearch();
  }
  componentDidMount() {
    const { messageBox } = this.refs;
    messageBox.addEventListener('scroll', this.handleScroll);
  }
  componentWillUnmount() {
    const { messageBox } = this.refs;
    messageBox.removeEventListener('scroll', this.handleScroll);
  }
  componentWillReceiveProps(nextProps) {
    const activeContact = nextProps.contactMgr.getActiveContact();
    if (activeContact !== this.state.activeContact) {
      this.setState({ visible: false, activeContact });
    }
    if (this.state.userOfflineError) {
      this.handleDismiss();
    }
    if (nextProps.newContactSearch && !activeContact && this.searchInput) {
      this.searchInput.focus();
    }
    if (activeContact && activeContact.status !== this.state.status) {
      this.setState({ status: activeContact.status });
    }
  }
  componentDidUpdate(prevProps, prevState) {
    this.scrollToBottom();
  }
  handleScroll = () => {
    const { messageBox } = this.refs;
    if (messageBox.scrollTop === 0) {
      this.props.setMsgScrollTop(true);
    } else {
      this.props.setMsgScrollTop(false);
    }
  }
  toggleVisibility = () => {
    this.setState({ visible: !this.state.visible });
  }
  scrollToBottom() {
    const { messageBox } = this.refs;
    messageBox.scrollTop = messageBox.scrollHeight - messageBox.clientHeight;
  }
  handleDismiss = () => {
    this.setState({ userOfflineError: false });
  }
  getSocial = (profile) => {
    const list = [];
    if (profile && profile.account) {
      for (const i of profile.account) {
        if (i.service === 'hackerNews') {
          list.push(<a href={i.proofUrl} target="_blank" key="hacker news"><Icon size="large" name="hacker news" /></a>);
        } else if (i.service === 'twitter' || i.service === 'facebook' || i.service === 'github') {
          list.push(<a href={i.proofUrl} target="_blank" key={i.service}><Icon size="large" name={i.service} /></a>);
        }
      }
      return list;
    }
    return null;
  }
  handleChange = (e, { value }) => {
    let pcontact;
    const { contactMgr } = this.props;
    const contacts = contactMgr.getDropDownContacts()
    for (const ct of contacts) {
      if (ct.value === value)
        pcontact = ct.contact
    }
    this.props.getPublicProfile(value);
    this.props.handleContactClick(pcontact);
  }
  getContactDropdown() {
    const { contactMgr } = this.props;
    // debugger
    const contacts = contactMgr.getDropDownContacts()

    let defaultName = '';
    if (contactMgr.getActiveContact()) {
      defaultName = contactMgr.getActiveContact().id;
    } else if (contacts[0] && contacts[0].value) {
      defaultName = contacts[0].value;
    }

    return (
      <Dropdown
        inline
        closeOnBlur
        closeOnChange
        options={contacts}
        onChange={this.handleChange}
        defaultValue={defaultName}
      />
    )
  }
  render() {
    const { visible, userOfflineError, activeContact } = this.state;
    const { logger, newContactSearch, userId, username, userData, plugin } = this.props;
    const myprofile = userData.profile;
    const myName = (myprofile && myprofile.name) ? myprofile.name : userId;
    const disabled = !(activeContact);
    let title = 'Loading ...';
    let status = statusIndicators.offline;
    if (activeContact) {
      title = activeContact.title;
      status = activeContact.status ? activeContact.status : 'black';
    }
    const { profile } = this.props.publicProfile;
    const description = (profile && profile.description) ? profile.description : '';
    const id = (activeContact && activeContact.id) ? activeContact.id : '';
    const social = this.getSocial(profile);

    let name = id;
    if (activeContact && activeContact.title) {
      const idx = activeContact.title.indexOf(' ');
      name = (idx > -1) ?
        activeContact.title.substr(0, idx) : activeContact.title;
    }

    const hasPublicKeyAndName = (this.props.contactMgr.hasPublicKey() && name !== '');
    const haveContacts = (activeContact !== undefined);
    const emptyContacts = this.props.contactMgr.getAllContacts().length === 0
    const messageFormDisable = newContactSearch || emptyContacts || (haveContacts && !hasPublicKeyAndName);
    let userIdWarning = null;
    const searchBool = newContactSearch || !activeContact;
    const index = (userId.indexOf('.id.blockstack') > 0) ? userId.indexOf('.id.blockstack') : userId.indexOf('.id')
    const shareLink = `https://www.stealthy.im/?add=${userId.substring(0, index)}`;
    const inviteText = encodeURIComponent('Hey ' + name + ',\n\n' + 'Click this link: ' + shareLink + ' to add ' + myName + ' as a Stealthy contact and see messages from them.\n\n Cheers!\n\n*P.S. This message is sent un-encrypted, use www.stealthy.im for secure communication.')
    const inviteInfo = `${'mailto:?subject=' + myName + '%20has%20added%20you%20as%20new%20Stealthy%20contact!&body=' + inviteText}`;
    const emailText = encodeURIComponent('Hey ' + name + ',\n\n' + 'Go to www.stealthy.im to see new messages from: ' + myName + '.\n\n Cheers!\n\n*P.S. This message is sent un-encrypted, use www.stealthy.im for secure communication.')
    const emailInfo = `${'mailto:?subject=' + myName + '%20has%20sent%20you%20a%20new%20Stealthy%20message!&body=' + emailText}`;
    if (haveContacts && !hasPublicKeyAndName && !searchBool) {
      userIdWarning = (
        <Message icon>
          <Icon name="info" />
          <Message.Content>
            <Message.Header>{name}'s app public key not found <Icon /><Button onClick={() => this.props.updateContactPubKeys()} basic icon="refresh" /></Message.Header>
            <Message.List>
              <Message.Item>Share <Icon name='vcard outline' /><a href={shareLink} target="_blank">invite link</a></Message.Item>
              <Message.Item>Send <Icon name='mail' /><a href={inviteInfo} target="_blank">e-mail invite</a></Message.Item>
              <Icon />
              <Message.Item>Stealthy uses the public key to encrypt your messages.</Message.Item>
              <Message.Item>You will be able to chat with {name} after they log in to Stealthy.</Message.Item>
              <Message.Item>More Info: <a href="https://blockstack.org/intro" target="_blank">https://blockstack.org/intro</a></Message.Item>
            </Message.List>
          </Message.Content>
        </Message>
      );
    }
    let userOfflineErrorMessage = null;
    if (userOfflineError) {
      userOfflineErrorMessage = (
        <Message error onDismiss={this.handleDismiss}>
          <Message.Header>{name} needs to be online for media transfers.</Message.Header>
        </Message>
      );
    }
    const { value } = this.state;
    const { loading, messageList, error } = this.props;
    const { profiles } = messageList;
    const buttonTitle = (disabled) ? 'New contact' : name;
    const searchBar = (searchBool) ? (
      <Form onSubmit={this.handleFormSubmit} className="search">
        <Search
          size="big"
          fluid
          loading={loading}
          onResultSelect={this.handleResultSelect}
          onSearchChange={this.handleSearchChange}
          results={profiles}
          open={profiles.length > 0 || error.length > 0}
          noResultsMessage={error}
          value={value}
          selectFirstResult
          input={
            <Input
              ref={(i) => { this.searchInput = i; }}
              id="SearchInput"
              size="big"
              fluid
              placeholder="Search for a person or id to message..."
              autoFocus
            />
          }
        />
      </Form>
    ) : null;
    const realTimeStyle = (status === 'green') ? {fontStyle: 'italic'} : {}
    const realTimeTitle = (status === 'green') ? (buttonTitle + ' 🚀') : buttonTitle
    const mailNotification = (status === 'green') ? null : (
      <Popup
        trigger={<a href={emailInfo} target="_blank"><Icon name='mail' color="blue" style={{marginLeft: '1em'}}/></a>}
        content="Send E-Mail Notification"
        position="top left"
      />
    )
    const showDropDown = (plugin) ? this.getContactDropdown() : realTimeTitle
    const activeProfile = (searchBool) ? null : (
      <Header as="h3" style={realTimeStyle} color={status}>To: {showDropDown}
        {mailNotification}
      </Header>
    );
    const disableFunctionality = (status !== 'green' || platform.name === 'Safari');
    const walletFunctionality = (this.props.walletInfo.disableWallet);
    const deleteButton = (plugin) ? null : (
      <Popup
        trigger={<Icon onClick={this.props.handleDeleteOpen} disabled={disabled} name="trash outline" size="large" color="red" />}
        content="Delete Contact"
        position="top left"
      />
    )
    const showButtons = (searchBool || plugin) ? null : (
      <div>
        {deleteButton}
        {/* <Popup
          trigger={<Icon onClick={this.toggleVisibility} disabled={disabled} name="user outline" size="large" color="black" />}
          content="Profile Information"
          position="top left"
        />
        <Popup
          trigger={<Icon onClick={this.props.handleTransactionOpen} disabled={walletFunctionality} name="bitcoin" color="yellow" size="large" />}
          content="In Progress..."
          position="top left"
        />*/}
        <Popup
          trigger={<Icon style={{marginLeft: '0.3em'}} onClick={this.props.handleShareDesktopOpen} disabled={disableFunctionality} name="desktop" size="large" color="yellow" />}
          content="Share Desktop"
          position="top left"
        />
        <Popup
          trigger={<Icon style={{marginLeft: '0.3em'}} onClick={this.props.handleVideoOpen} disabled={disableFunctionality} name="video camera" color="green" size="large" />}
          content="Video Chat"
          position="top left"
        />
      </div>
    );
    const fitted = !!(searchBool);
    let showIndex = 0;
    this.props.messages.map((message, index) => {
      if (message.author === userId) {
        showIndex = index;
      }
    });
    return (
      <Sidebar.Pushable>
        <Sidebar
          as={Card}
          animation="overlay"
          direction="right"
          visible={this.state.visible}
        >
          <Card centered fluid>
            <Card.Content>
              <Card.Header>
                {title} ({id})
              </Card.Header>
              <Card.Meta>
                {social}
              </Card.Meta>
              <Card.Description>
                {description}
              </Card.Description>
            </Card.Content>
          </Card>
        </Sidebar>
        <Sidebar.Pusher
          id="messagePusher"
          style={{ display: 'flex',
            flexDirection: 'column',
            height: '100%' }}
        >
          <Dropzone
            id="dropzone"
            style={{ flex: '1 1 100%',
              display: 'flex',
              flexDirection: 'column',
              height: '100%' }}
            disableClick onDrop={this.onDrop}
          >
            {searchBar}
            <Grid className="activeContact" style={{ paddingBottom: '1vh' }} >
              <Grid.Column textAlign="left" floated="left" width={8}>
                {activeProfile}
              </Grid.Column>
              <Grid.Column textAlign="right" floated="right" width={8}>
                {showButtons}
              </Grid.Column>
            </Grid>
            <Divider fitted={fitted} />
            <div
              className="messageHistory"
              ref={'messageBox'}
              style={{ overflowY: 'auto',
                overflowX: 'hidden',
                scrollTop: 'scrollHeight',
                paddingBottom: '1vh',
                flex: '1 1 100%' }}
            >
              {this.props.messages.map((message, index) => (
                <BMessage activeContact={activeContact} key={index} index={index} showIndex={showIndex} {...message} userId={userId} />
              ))}
              {userOfflineErrorMessage}
              {userIdWarning}
            </div>
            <div className="messageInput" style={{ overflow: 'disabled' }}>
              <MessageForm
                name={name}
                disabled={messageFormDisable}
                activeContact={activeContact}
                logger={logger}
                status={status}
                onMessageSend={this.props.handleNewMessage}
              />
            </div>
          </Dropzone>
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    );
  }
}

MessageList.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.string,
  messageList: PropTypes.object,
  changeUsername: PropTypes.func,
  fetchProfiles: PropTypes.func,
  resetContactSearch: PropTypes.func,
  messages: PropTypes.arrayOf(PropTypes.object),
  user: PropTypes.object,
  handleNewMessage: PropTypes.func,
  deleteContact: PropTypes.func,
  publicProfile: PropTypes.object,
  userId: PropTypes.string,
};

const mapStateToProps = createStructuredSelector({
  messageList: makeSelectMessageList(),
  person: makeSelectPerson(),
  userData: makeSelectUserData(),
  profiles: makeSelectProfiles(),
  username: makeSelectUsername(),
  loading: makeSelectLoading(),
  error: makeSelectError(),
  contactMgr: makeSelectContactMgr(),
  publicProfile: makeSelectPublicProfile(),
  avatarUrl: makeSelectAvatarUrl(),
  userId: makeSelectUserId(),
  messages: makeSelectMessages(),
  newContactSearch: makeSelectNewContactSearch(),
  walletInfo: makeSelectWalletInfo(),
});

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(MessageListCreators, dispatch);
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'messageList', reducer });
const withSaga = injectSaga({ key: 'messageList', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(MessageList);
