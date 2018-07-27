/**
 *
 * UserIdForm
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import { Accordion, Button, Form, Header, Icon, Message, Modal } from 'semantic-ui-react';

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import { selectUserIdFormDomain } from './selectors';
import reducer from './reducer';
import saga from './saga';
const firebase = require('firebase');

export class UserIdForm extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.state = {
      step: 0,
      email: '',
      choice1: '',
      error0: true,
      error1: false,
      error2: false,
      activeIndex: null,
    };

    this.anonalytics = this.props.analytics;
    if (!this.anonalytics) {
      throw 'Error accessing database.';
    }
  }

  handleGetStealthyId = () => {
    this.anonalytics.aeGetStealthyId();
    this.setState({ step: 1 });
  }

  handleGetBlockstackId = () => {
    this.anonalytics.aeGetBlockstackId();
  }

  handleClick = (e, titleProps) => {
    this.anonalytics.aeWhyDoINeedAnId();

    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;

    this.setState({ activeIndex: newIndex });
  }
  handleChange = (e, { name, value }) => {
    if (name === 'email') {
      let reg = new RegExp('^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$');
      let found = value.match(reg);
      this.setState({ email: value, error0: !found });
    }
    else if (name === 'choice1') {
      let reg = new RegExp('^[a-zA-Z0-9]+$');
      let found = value.match(reg);
      let error1 = (!found && value.length)
      this.setState({ choice1: value.toLowerCase(), error1, error2: false });      
    }
  }
  handleSubmit = async (e) => {
    const snapshot = await firebase.database().ref('/global/registration/usedIds/').once('value')
    .then(function(snapshot) {
      return snapshot
    })
    let {choice1} = this.state
    const error1 = snapshot.child(choice1).exists()
    const size = choice1.length < 32 && choice1.length > 4
    const error2 = (!size && choice1.length)
    this.setState({error1, error2})
    if (!error1 && !error2) {
      e.preventDefault()
      const {identityAddress} = this.props.userData
      const {email} = this.state
      const epath = '/global/registration/email/'
      firebase.database().ref(epath).push({time: Date.now(), email, hash: identityAddress, choice1})
      const ipath1 = '/global/registration/usedIds/' + choice1
      firebase.database().ref(ipath1).set({status: 'pending'})
      this.anonalytics.aeStealthyIdFlow('1', 'Submit');
      this.setState({ step: 2 });
    }
  }
  handleIdBack = (e) => {
    e.preventDefault()
    this.anonalytics.aeStealthyIdFlow('1', 'Back');
    this.setState({ email: '', choice1: '', error0: false, error1: false, error2: false, step: 0 });
  }
  goToRegistration = () => {
    this.anonalytics.aeStealthyIdFlow('2', 'Register');
    this.setState({ step: 3 });
    let exists = false
    firebase.database().ref('/global/registration/ids/').once('value')
    .then(function(snapshot) {
      exists = (snapshot.child(this.state.choice1).exists())
    })
  }
  // handleRegistrationBack = () => {
  //   this.anonalytics.aeStealthyIdFlow('2', 'Back');
  //   this.setState({ email: '', error0: true, step: 1 });
  // }
  // startRegistration = () => {
  //   this.anonalytics.aeStealthyIdFlow('3', 'IUnderstand');
  // }
  // handleDisclaimerBack = () => {
  //   this.anonalytics.aeStealthyIdFlow('3', 'Back');
  //   this.setState({ email: '', error0: true, step: 1 });
  // }
  getFormInfo() {
    const { activeIndex, error0, error1, error2, choice1, email } = this.state;
    if (this.state.step === 0) {
      return (
        <Message icon onDismiss={this.props.handleSignOut}>
          <Icon name="registered" />
          <Message.Content>
            <Message.Header>To use Stealthy, you will need to add a username to your identity address or log in with an identity address that has a username.</Message.Header>
            <Icon />
            <Message.List>
              <Button size='large' style={{backgroundColor: '#34bbed', color: 'white'}} onClick={this.handleGetStealthyId}>SignUp for a Free ID</Button>
              <Icon />
              <Icon />
              <Button size="large" style={{ backgroundColor: '#2C113A', color: 'white' }} onClick={this.handleGetBlockstackId} as="a" href="http://localhost:8888/profiles/i/add-username/0/search" target="_blank">Get Blockstack ID</Button>
            </Message.List>
            <Icon />
            <Message.List>
              <Accordion>
                <Accordion.Title active={activeIndex === 0} index={0} onClick={this.handleClick}>
                  <Icon name="dropdown" />
                  <b>Why do I need an id?</b>
                </Accordion.Title>
                <Accordion.Content active={activeIndex === 0}>
                  <p>
                    Stealthy relies upon file based communications built upon Blockstack's Atlas file system. Without adding a username to your Blockstack ID, it is not possible for file based communications to take place.
                  </p>
                  <p><a href="https://blockstack.org/faq/#what_is_a_blockstack_id?" target="_blank"><b>More Information</b></a></p>
                </Accordion.Content>
              </Accordion>
            </Message.List>
          </Message.Content>
        </Message>
      );
    } else if (this.state.step === 1) {
      return (
        <Form style={{ padding: '2em' }} size="small">
          <Header as="h2" textAlign="left">Contact E-Mail Address</Header>
          <Header as="h4" textAlign="left" color="grey">We will use this e-mail for ID registration and Stealthy communications.</Header>
          <Header as="h4" textAlign="left" color="red">Your contact is private and will never be shared with third parties.</Header>
          <Form.Input autoComplete="off" error={error0} size="big" placeholder="E-Mail" name="email" value={email} onChange={this.handleChange} />
          <Message
            error
            visible={error1}
            header='Action Forbidden'
            content='User ID has already been registered, please try a different name.'
          />
          <Message
            error
            visible={error2}
            header='Action Forbidden'
            content='User ID is too short'
          />
          <Form.Input autoComplete="off" error={error1} size="big" placeholder="ID Choice" name="choice1" value={choice1} onChange={this.handleChange} />
          <Icon />
          <Button style={{marginBottom: '1em'}} compact floated="right" disabled={error0 || error1 || error2} icon="check" size="big" color="blue" content="Submit" onClick={this.handleSubmit} />
          <Button style={{marginBottom: '1em'}} compact floated="left" icon="close" size="big" color="grey" content="Back" onClick={this.handleIdBack} />
          {/*<Button.Group compact floated='right'>
            <Button style={{marginBottom: '1em', marginRight: '1em'}} icon="close" size="big" color="grey" content="Back" onClick={this.handleIdBack} />
            <Button style={{marginBottom: '1em'}} disabled={error} icon="check" size="big" color="blue" content="Submit" onClick={this.handleSubmit} />
          </Button.Group>*/}
        </Form>
      );
    } else if (this.state.step === 2) {
      return (
        <Form style={{ padding: '1em', paddingBottom: '2em' }} size="small">
          <Header as="h2" textAlign="center">E-Mail Registered: {name}</Header>
          <Header as="h4" textAlign="left" color="grey">We will e-mail you in the next 1-2 business days with instructions on getting a free Stealthy ID.</Header>
          <Icon />
          <Button style={{marginBottom: '1em'}} compact icon="check" color="blue" floated="right" size="big" content="Done" onClick={this.props.handleSignOut} />
          {/*<Button.Group vertical fluid>
            <Button icon="check" color="blue" size="big" content="Register for 0.001 BTC" onClick={this.goToRegistration} />
            <Button basic disabled />
            <Button icon="close" color="grey" size="big" content="Back" onClick={this.handleRegistrationBack} />
          </Button.Group>*/}
        </Form>
      );
    }
    // } else if (this.state.step === 3) {
    //   return (
    //     <Form style={{ padding: '1em', paddingBottom: '2em' }} size="small">
    //       <Header as="h2" textAlign="center">Name Registration Disclaimer</Header>
    //       <Header as="h4" textAlign="left" >You’re about to create a registration request for <i>{name}.stealthy</i></Header>
    //       <Header as="h4" textAlign="left" >Please confirm you understand the following:</Header>
    //       <ul>
    //         <li style={{ paddingBottom: '0.5em' }}>Registrations are a race & there's a small chance someone else will win.</li>
    //         <li style={{ paddingBottom: '0.5em' }}>Registration requests have a fee regardless of the outcome.</li>
    //         <li style={{ paddingBottom: '0.5em' }}>Fees are sent to Stealthy as part of the subscription.</li>
    //       </ul>
    //       <Icon />
    //       <Button.Group vertical fluid>
    //         <Button icon="check" color="blue" size="big" content="I Understand" onClick={this.startRegistration} />
    //         <Button basic disabled />
    //         <Button icon="close" color="grey" size="big" content="Back" onClick={this.handleDisclaimerBack} />
    //       </Button.Group>
    //     </Form>
    //   );
    // }
  }
  render() {
    const form = this.getFormInfo();
    return (
      <Modal size="tiny" open>
        {form}
      </Modal>
    );
  }
}

UserIdForm.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  userIdForm: selectUserIdFormDomain,
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
  };
}

const withConnect = connect(mapStateToProps, mapDispatchToProps);

const withReducer = injectReducer({ key: 'userIdForm', reducer });
const withSaga = injectSaga({ key: 'userIdForm', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(UserIdForm);
