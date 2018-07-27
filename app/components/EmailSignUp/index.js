/**
*
* EmailSignUp
*
*/

import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Header,
  Icon,
  Image,
  Modal,
  Form,
} from 'semantic-ui-react';
const firebase = require('firebase');

class EmailSignUp extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      choice1: '',
      error: true,
    };
  }
  handleChange = (e, { name, value }) => {
    if (name === 'email') {
      let reg = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$');
      let found = value.match(reg);
      this.setState({ email: value, error: !found });
    }
  }
  handleSubmit = async (e) => {
    if (!this.state.error) {
      e.preventDefault()
      const {email} = this.state
      let {product, productType} = this.props
      // if (!product)
      //   product = 'desktop'
      const epath = '/global/registration/mobileSignUp/'
      firebase.database().ref(epath).push({time: Date.now(), email, product: productType})
      this.props.handleSignUpClose()
      this.setState({ email: '' });
    }
  }
  render() {
    const {
      showSignUp,
      handleSignUpClose,
    } = this.props;
    const { error, email } = this.state;
    return (
      <div>
        <Modal
          open={showSignUp}
          name="delete"
        >
          <Modal.Header icon="signup" content="We are working hard on Mobile support!" />
          <Modal.Content image>
            <Image wrapped size="small" src="https://thumbs.gfycat.com/UnitedUnequaledBedlingtonterrier-size_restricted.gif" />
            <Modal.Description>
              <Form style={{ padding: '2em' }} size="small">
                <Header as="h2" textAlign="left">SignUp E-Mail Address</Header>
                <Header as="h4" textAlign="left" color="grey">We will notify you when Mobile Stealthy is ready.</Header>
                <Header as="h4" textAlign="left" color="red">Your contact is private and will not be shared.</Header>
                <Form.Input autoComplete="off" error={error} size="big" placeholder="E-Mail" name="email" value={email} onChange={this.handleChange} />
              </Form>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button color="red" inverted onClick={handleSignUpClose}>
              <Icon name="remove circle" /> Cancel
            </Button>
            <Button color="green" inverted onClick={this.handleSubmit}>
              <Icon name="check circle" /> Submit
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

EmailSignUp.propTypes = {
  showSignUp: PropTypes.bool,
  handleSignUpClose: PropTypes.func,
};

export default EmailSignUp;
