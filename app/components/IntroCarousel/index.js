/**
*
* IntroCarousel
*
*/

import React from 'react';
// import styled from 'styled-components';

import {
  Button,
  Card,
  Grid,
  Header,
  Image,
  Modal,
} from 'semantic-ui-react';

import elliot from '../../images/elliot.png';
import custom from '../../images/custom.png';
import snowden from '../../images/snowden.jpg';
import chatIcon from '../../images/blue512.png';
import chatV1 from '../../images/StealthyV1.png';
import flow from '../../images/stealthyFlow.png';

class IntroCarousel extends React.Component { // eslint-disable-line react/prefer-stateless-function
   constructor(props) {
    super(props);
    this.state = {
      showPage: 0,
    };
  }
  handlePageIncr = () => {
    this.setState({ showPage: this.state.showPage + 1 });
  }
  handlePageDecr = () => {
    this.setState({ showPage: this.state.showPage - 1 });
  }
  render() {
    const {
      open,
      close,
      openSettings,
      writeSettings,
      initSettings,
      anonalytics,
    } = this.props;
    const {showPage} = this.state
    const ModalContent = (showPage === 0) ? (
      <Grid container stackable verticalAlign='middle'>
        <Grid.Row>
          <Grid.Column width={8}>
            <Header as='h3' style={{ paddingTop: '2em', fontSize: '1.7em' }}>We help people communicate freely 🤠</Header>
            <p style={{ fontSize: '1.33em' }}>
              Stealthy uses no signaling servers, middle men, or centralized services. All your data is controlled by you and only accessible to you.
            </p>
            <Grid.Column style={{ paddingBottom: '2em', paddingTop: '3em' }}>
              <Header as='h3' style={{ fontSize: '1.7em' }}>"I am here to help you with the tool!"</Header>
              <p style={{ fontSize: '1.33em' }}>
                <Image avatar src={chatIcon} />
                <b>Stealthy</b> <i>Chief Communication Officer</i>
              </p>
            </Grid.Column>
          </Grid.Column>
          <Grid.Column floated='right' width={7}>
            <Image
              bordered
              rounded
              size='huge'
              src={flow}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    ) : (showPage === 1) ? (
      <Card.Group style={{display: 'flex', flexDirection: 'row'}}>
        <Card style={{flex: 1}}>
          <Card.Content>
            <Image floated='right' size='small' src={elliot} />
            <Card.Header>
              Stealthy Mode
            </Card.Header>
            <Card.Meta>Feature Rich</Card.Meta>
            <Card.Description>
              Enable live chat, video, file sharing, auto-discovery, etc.
            </Card.Description>
          </Card.Content>
          <Card.Content extra>
            <Button
              floated='right'
              inverted
              color='green'
              onClick={() => {
                const convenienceSettings = {
                  console: false,
                  search: false,
                  discovery: true,
                  webrtc: true,
                }
                anonalytics.aeSettings('Convenience Mode');
                writeSettings(convenienceSettings);
                initSettings(convenienceSettings);
                close()
              }}
            >
              Choose
            </Button>
          </Card.Content>
        </Card>
        <Card style={{flex: 1}}>
          <Card.Content>
            <Image floated='right' size='small' src={snowden} />
            <Card.Header>
              Snowden Mode
            </Card.Header>
            <Card.Meta>Ultra Secure</Card.Meta>
            <Card.Description>
              Disable all features and run in bare bones mode.
            </Card.Description>
          </Card.Content>
          <Card.Content extra>
            <Button
              floated='right'
              inverted
              color='green'
              onClick={() => {
                const snowdenSettings = {
                  console: false,
                  search: true,
                  discovery: false,
                  webrtc: false,
                }
                anonalytics.aeSettings('Snowden Mode');
                writeSettings(snowdenSettings);
                initSettings(snowdenSettings);
                close()
              }}
            >
              Choose
            </Button>
          </Card.Content>
        </Card>
        <Card style={{flex: 1}}>
          <Card.Content>
            <Image floated='right' size='small' src={custom} />
            <Card.Header>
              Custom Mode
            </Card.Header>
            <Card.Meta>iSecure</Card.Meta>
            <Card.Description>
              Choose the options that best fit your needs.
            </Card.Description>
          </Card.Content>
          <Card.Content extra>
            <Button floated='right' inverted color='green' onClick={() => {
              close()
              openSettings()}}
            >
              Choose
            </Button>
          </Card.Content>
        </Card>
      </Card.Group>
    ) : null;
    const ModalActions = (showPage === 0) ? (
      <Modal.Actions>
        <Button inverted color="green" onClick={this.handlePageIncr}>
          Next
        </Button>
      </Modal.Actions>
    ) : (showPage === 1) ? (
      <Modal.Actions>
        <Button inverted color="blue" onClick={this.handlePageDecr}>
          Previous
        </Button>
      </Modal.Actions>
    ) : null;
    const ModalHeader = (showPage === 0) ? (
      <Modal.Header style={{fontSize: '2.5em' }}>Welcome to Stealthy</Modal.Header>
    ) : (showPage === 1) ? (
      <Modal.Header style={{fontSize: '2.5em' }}>Configure Settings</Modal.Header>
    ) : null
    return (
      <Modal size="large" dimmer="blurring" open={open}>
        {ModalHeader}
        <Modal.Content>
          {ModalContent}
        </Modal.Content>
        {ModalActions}
      </Modal>
    );
  }
}

IntroCarousel.propTypes = {

};

export default IntroCarousel;
