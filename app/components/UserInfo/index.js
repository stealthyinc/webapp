/**
*
* UserInfo
*
*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Card, Container, Icon, Image } from 'semantic-ui-react';

class UserInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: (this.props.user && this.props.user.name()) || 'Nameless',
      avatarUrl: (this.props.user && this.props.user.avatarUrl()) || undefined,
    };
  }
  render() {
    return (
      <Container fluid>
        <Card>
          <Image src={this.state.avatarUrl} />
          <Card.Content>
            <Card.Header>
              {this.state.name}
            </Card.Header>
            <Card.Meta>
              Hacker
            </Card.Meta>
            <Card.Description>
              Tinkering on blockstack...
            </Card.Description>
          </Card.Content>
          <Card.Content extra>
            <a>
              <Icon name="user" />
              27 Friends
            </a>
          </Card.Content>
        </Card>
      </Container>
    );
  }
}

UserInfo.propTypes = {
  user: PropTypes.object,
};

export default UserInfo;
