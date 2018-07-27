/**
 *
 * ContactList
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators, compose } from 'redux';
import Blockies from 'react-blockies';

import {
  // Dropdown,
  Icon,
  Image,
  Label,
  List,
  Responsive,
  Segment,
  Sidebar,
} from 'semantic-ui-react';

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import {
  makeSelectContactMgr,
} from '../MessagePage/selectors';
import * as ContactListCreators from './actions';
import reducer from './reducer';
import saga from './saga';

export class ContactList extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);
    this.uniqKey = 0;
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.contactMgr.getActiveContact()) { this.props.getPublicProfile(nextProps.contactMgr.getActiveContact().id); }
  }
  getKey() {
    this.uniqKey += 1;
    return this.uniqKey;
  }
  handleClick = (e, { contact }) => {
    const selectedUserId = contact.id;
    this.props.getPublicProfile(selectedUserId);
    this.props.handleContactClick(contact);
  }
  getContactAsListItem(contact) {
    const { contactMgr } = this.props;
    const activeContact = contactMgr.getActiveContact();
    const active = (activeContact && activeContact.id === contact.id);
    const unreadMessagesDot = (contact.unread > 0) ?
      (
        <List.Content verticalAlign="middle" floated="right">
          <Label color="blue">{contact.unread}</Label>
        </List.Content>
      ) : (
        <List.Content verticalAlign="middle" floated="right">
        </List.Content>
      );
    const seed = (contact.id) ? contact.id : 'garbage';
    const label = (contact.status === 'connecting') ? (
      <Label as="a" circular active basic attached="bottom left">
        <Icon style={{ margin: 2 }} color={contact.status} size="small" name="spinner" loading />
      </Label>
    ) : (
      <Label style={{ margin: 2 }} size="small" as="a" circular active color={contact.status} attached="bottom left" />
    );
    const profileImage = (contact.image) ? (
      <Image>
        <Image circular size="tiny" src={contact.image} inline bordered />
        {label}
      </Image>
    )
     : (
       <Image circular >
         <Blockies seed={seed} size={20} />
         {label}
       </Image>
    );
    const name = (contact.title) ? contact.title : contact.id;
    const liColor = (active) ? { backgroundColor: '#e6f2ff' } : { backgroundColor: 'white' };
    return (
      <List.Item style={liColor} contact={contact} type="list" active={active} onClick={this.handleClick} key={this.getKey()}>
        {unreadMessagesDot}
        {profileImage}
        <List.Content verticalAlign="middle">
          <Responsive minWidth={840}>
            <List.Header as="a">{name}</List.Header>
            <List.Description><i>{contact.summary}</i></List.Description>
            <Icon />
            <List.Description><b>{contact.time}</b></List.Description>
          </Responsive>
        </List.Content>
      </List.Item>
    );
  }
  getContactList = (myContactArr) => {
    const listItems = [];
    for (const contact of myContactArr) {
      listItems.push(this.getContactAsListItem(contact));
    }
    return (
      <List className="addContact" size="large" selection animated divided>
        {listItems}
      </List>
    );
  }
  render() {
    const { logger, showVideoInvite, contactMgr } = this.props;
    const contactListHtml = this.getContactList(contactMgr.getContacts());
    // const friendOptions = [
    //   {
    //     text: 'Stealthy IM',
    //     value: 'Stealthy IM',
    //     image: { avatar: true, src: 'https://www.stealthy.im/blue256.png' },
    //   },
    //   {
    //     text: 'Graphite Docs',
    //     value: 'Graphite Docs',
    //     image: { avatar: true, src: 'https://image.ibb.co/hde71b/AppIcon.png' },
    //   },
    // ]
    return (
      <div style={{ overflowX: 'hidden', overflowY: 'auto', textAlign: 'left', width: '28%' }}>
        {/*<Dropdown fluid placeholder='Select Message AppSpace' selection options={friendOptions} />*/}
        {contactListHtml}
      </div>
    );
  }
}

ContactList.propTypes = {
  contactMgr: PropTypes.object,
  handleContactClick: PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  contactMgr: makeSelectContactMgr(),
});

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(ContactListCreators, dispatch);
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'contactList', reducer });
const withSaga = injectSaga({ key: 'contactList', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(ContactList);
