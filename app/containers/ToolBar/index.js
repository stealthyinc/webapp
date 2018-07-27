/**
 *
 * ToolBar
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators, compose } from 'redux';

import {
  Button,
  Form,
  Header,
  Icon,
  Image,
  Input,
  Menu,
  Popup,
  Responsive,
  Search,
  Segment,
  Sidebar,
} from 'semantic-ui-react';

import { updateDynamicStep, handleItemClick } from './workers';

import * as ToolBarCreators from './actions';
import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import makeSelectToolBar from './selectors';
import {
  makeSelectNewContactSearch,
} from '../MessageList/selectors';
import {
  makeSelectContactMgr,
} from '../MessagePage/selectors';
import {
  makeSelectUserId,
  makeSelectAvatarUrl,
} from '../BlockPage/selectors';
import reducer from './reducer';
import saga from './saga';
import Blockies from 'react-blockies';
import Brand from '../../images/blue512.png';

export class ToolBar extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      visible: false,
    };
    this.updateDynamicStep = updateDynamicStep.bind(this);
    this.handleItemClick = handleItemClick.bind(this);
  }
  toggleVisibility = () => this.setState({ visible: !this.state.visible })
  render() {
    const { profile } = this.props.userData;
    const name = (profile && profile.name) ? profile.name : this.props.userId;
    const seed = (this.props.userId) ? this.props.userId : 'garbage';
    const profileImage = (this.props.avatarUrl) ? (
      <Image size="mini" circular src={this.props.avatarUrl} bordered />
    ) : (
      <Image size="mini" circular bordered>
        <Blockies seed={seed} size={8} />
      </Image>
    );
    const emailInfo = `${'mailto:support@stealthy.im?subject=Need%20help%20with%20stealthy&body='
          + '%0A%0A%0A%0A%0A%0A%0A%0A%0A%0A%0A----------------------------------------------------------------------------'
          + 'System information for debugging----------------------------------------------------------------------------%0A'}${
           encodeURIComponent(JSON.stringify(require('platform')))}`;

    return (
      <div
        className="toolbar"
        style={{ flex: '0 0 69px' }}
      >
        <Sidebar.Pushable as={Segment}>
          <Sidebar as={Menu} size="tiny" direction="right" borderless compact position="right" animation="slide out" visible={this.state.visible}>
            <Menu.Item position="right" name="help" onClick={this.updateDynamicStep}>
              <Icon size="mini" />
              <Popup
                trigger={<Icon name="help circle outline" color="black" size="large" />}
                content="How To?"
                position="top left"
              />
            </Menu.Item>
            <Menu.Item position="right" as="a" href={emailInfo} name="mail">
              <Icon size="tiny" />
              <Popup
                trigger={<Icon name="mail outline" color="blue" size="large" />}
                content="E-Mail: support@stealthy.im"
                position="top left"
              />
            </Menu.Item>
            <Menu.Item position="right" name="settings" onClick={this.handleItemClick}>
              <Icon size="tiny" />
              <Popup
                trigger={<Icon name="settings" color="grey" size="large" />}
                content="Settings"
                position="top left"
              />
            </Menu.Item>
            <Menu.Item position="right" name="logout" onClick={this.props.handleSignOut}>
              <Icon size="tiny" />
              <Popup
                trigger={<Icon name="log out" color="red" size="large" />}
                content="Logout"
                position="top left"
              />
            </Menu.Item>
          </Sidebar>
          <Sidebar.Pusher>
            <Menu size="huge" fluid borderless>
              <Menu.Menu position="left">
                <Menu.Item fitted>
                  <Icon size="tiny" />
                  <img src={Brand} />
                </Menu.Item>
                <Menu.Item />
                <Menu.Item>
                  <Button content="New Message" icon="write" color="green" inverted onClick={this.props.addNewContactClick} />
                </Menu.Item>
              </Menu.Menu>
              <Menu.Menu position="right">
                <Menu.Item fitted><b>{name}</b><Icon size="tiny" /></Menu.Item>
                <Menu.Item as="a" href="http://localhost:8888/profiles" target="_blank" name="profile">
                  <Popup
                    trigger={profileImage}
                    content="My Profile"
                    position="top left"
                  />
                </Menu.Item>
                <Menu.Item name="more options" onClick={this.toggleVisibility}>
                  <Icon name="ellipsis horizontal" />
                </Menu.Item>
              </Menu.Menu>
            </Menu>
          </Sidebar.Pusher>
        </Sidebar.Pushable>
      </div>
    );
  }
}

ToolBar.propTypes = {
  handleSignOut: PropTypes.func,
  userId: PropTypes.string,
};

const mapStateToProps = createStructuredSelector({
  toolbar: makeSelectToolBar(),
  userId: makeSelectUserId(),
  contactMgr: makeSelectContactMgr(),
  newContactSearch: makeSelectNewContactSearch(),
  avatarUrl: makeSelectAvatarUrl(),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(ToolBarCreators, dispatch);
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'toolBar', reducer });
const withSaga = injectSaga({ key: 'toolBar', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(ToolBar);
