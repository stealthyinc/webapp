/**
*
* MessageForm
*
*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Image, Input } from 'semantic-ui-react';
import Brand from '../../images/stealthy_plane.svg';

class MessageForm extends Component {
  static propTypes = {
    onMessageSend: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props);
    this.state = {
      message: '',
    };
  }
  componentWillReceiveProps(nextProps) {
    if (!nextProps.disabled && nextProps.activeContact) {
      this.messageInput.focus();
    }
  }
  handleFormSubmit = (event) => {
    event.preventDefault();
    if (this.state.message !== '') {
      this.props.onMessageSend(this.state.message);
      this.setState({ message: '' });
    }
  }
  handleChange = (e, { name, value }) => this.setState({ [name]: value })
  render() {
    const { name, logger, disabled } = this.props;
    const { message } = this.state;
    const placeholder = `Message ${name}`;
    return (
      <Form size="big" reply onSubmit={this.handleFormSubmit}>
        <Input
          ref={(i) => { this.messageInput = i; }}
          size="big"
          fluid
          icon={null}
          label={<Button
            basic compact onClick={this.handleFormSubmit} icon={
              <Image src={Brand} size="medium" />
          }
          />}
          labelPosition="right"
          placeholder={placeholder}
          name="message"
          value={message}
          onChange={this.handleChange}
          disabled={disabled}
          autoComplete="off"
          autoFocus
        />
      </Form>
    );
  }
}

export default MessageForm;
