/**
*
* EmailSignUp
*
*/

import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Checkbox,
  Header,
  Icon,
  Image,
  Modal,
  Form,
  TextArea
} from 'semantic-ui-react';
const firebase = require('firebase');

class DeveloperSignUp extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      about: '',
      aerror: true,
      error: true,
      thanks: false,
    };
  }
  handleAbout = (e, { name, value }) => {
    if (name === 'about') {
      let found = value.length > 0;
      this.setState({ about: value, aerror: !found });
    }
  }
  handleChange = (e, { name, value }) => {
    if (name === 'email') {
      let reg = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$');
      let found = value.match(reg);
      this.setState({ email: value, error: !found });
    }
  }
  handleSubmit = async (e) => {
    if (!this.state.error && !this.state.aerror) {
      e.preventDefault()
      const {email, about} = this.state
      const epath = '/global/registration/developerSignUp/'
      firebase.database().ref(epath).push({time: Date.now(), email, about})
      this.setState({ email: '', about: '', thanks: true });
    }
  }
  handleClose = () => {
  	this.setState({thanks: false})
  	this.props.handleSignUpClose()
  }
  render() {
    const {
      showSignUp,
      handleSignUpClose,
    } = this.props;
    const { error, aerror, about, email, thanks } = this.state;
    if (thanks) {
    	return (
			<Modal open={thanks} dimmer={true} size='small'>
			    <Modal.Content>
                	<Header as="h2" textAlign="left" color="grey">Thank You! We will be in touch soon. 🙌</Header>
			    </Modal.Content>
			    <Modal.Actions>
		            <Button color="green" inverted onClick={this.handleClose}>
		              <Icon name="check circle" /> Done
		            </Button>
			    </Modal.Actions>
			</Modal>
		)
    }
    return (
      <div>
        <Modal
          dimmer={true}
          open={showSignUp}
        >
          <Modal.Header icon="signup" content="Let's work together!" />
          <Modal.Content image>
            <Image wrapped size="large" src="https://media.giphy.com/media/7ygVM8vWhlkEo/giphy.gif" />
            <Modal.Description>
              <Form style={{ padding: '1em' }} size="large">
                <Header as="h3" textAlign="left" color="grey">Tell us how we can help</Header>
        		<Form.Field autoComplete="off" error={aerror} control={TextArea} name="about" value={about} onChange={this.handleAbout} placeholder='I want to use Stealthy to build...' />
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

DeveloperSignUp.propTypes = {
  showSignUp: PropTypes.bool,
  handleSignUpClose: PropTypes.func,
};

export default DeveloperSignUp;
