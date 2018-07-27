/**
*
* HomePageLayout
*
*/

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  Button,
  Container,
  Embed,
  Grid,
  Header,
  Icon,
  Image,
  List,
  Menu,
  Message,
  Modal,
  Segment,
  Tab,
} from 'semantic-ui-react';

import laptop from '../../images/laptopChat.png';
import msgBack from '../../images/msgBack.png';
import appleStore from '../../images/appleStore.svg';
import googlePlay from '../../images/googlePlay.svg';
import chatIcon from '../../images/blue512.png';
import chatV1 from '../../images/StealthyV1.png';
import flow from '../../images/rStealthyFlow.jpg';
import graphitePlugin from '../../images/plugin.jpg';
import FAQ from 'components/Faq';
import SharedIndexDataFlow from '../../images/SharedIndexDataFlow.svg'
import SharedIndexFlow from '../../images/SharedIndexFlow.svg'
import SharedIndexFuture from '../../images/SharedIndexFuture.svg'
import AppTray from '../../images/AppTray.svg'


import YouTube from 'react-youtube';
import '../../devices.min.css';

import EmailSignUp from '../EmailSignUp'
import DeveloperSignUp from '../DeveloperSignUp'

function getPane(key, icon, content, src, size) {
  const paddingRight = (size === 'small') ? '14px' : '0px'
  return {
    menuItem: {key: key, icon: icon, content: content},
    render: () => ( <Image centered fluid bordered rounded src={src} style={{ paddingRight: paddingRight }} />),
  }
}

function getPanes(size) {
  return [
    getPane("dapp", "plug", "Mobile dApp Integration", AppTray, size),
    getPane("infrastructure", "building", "Shared dApp User Flow", SharedIndexFlow, size),
    getPane("dataflow", "random", "dApp Data Flow Diagram", SharedIndexDataFlow, size),
    getPane("index", "indent", "Shared Data Index Schema", SharedIndexFuture, size),
  ];
}

export default class HomepageLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      productType: '',
      showSignUp: false,
      showDevSignUp: false,
    };
  }
  scrollToTop = () => {
    scroll.scrollToTop();
  }
  scrollToBottom = () => {
    scroll.scrollToBottom();
  }
  scrollTo = () => {
    scroll.scrollTo(700);
  }
  handleSignUpOpenIOS = () => this.setState({ showSignUp: true, productType: 'iPhone' })
  handleSignUpOpenAND = () => this.setState({ showSignUp: true, productType: 'Android'})
  handleSignUpClose = () => this.setState({ showSignUp: false })
  handleDevSignUpOpen = () => this.setState({ showDevSignUp: true })
  handleDevSignUpClose = () => this.setState({ showDevSignUp: false })
  render() {
    const { queryRef, product, plugin } = this.props;
    console.log("Product", product)
    const icon = (queryRef === 'hn') ? 'hacker news' : (queryRef === 'producthunt') ? 'product hunt' : (queryRef === 'rd') ? 'reddit' : (queryRef === 'ih') ? 'gitlab' : '';
    const stub = (queryRef === 'hn') ? 'Hacker News Community!' : (queryRef === 'producthunt') ? 'Product Hunters!' : (queryRef === 'rd') ? 'Redditers!' : (queryRef === 'ih') ? 'Indie Hackers!' : '';
    const message = `Welcome ${stub}`;
    const size = (product) ? 'small' : 'big';
    const margin = (product) ? '0.5em' : '2em';
    const opts = {
      height: '736',
      width: '414',
      playerVars: { // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
        rel: 0
      }
    };
    let menuSettings = {
      secondary: true,
      pointing: true,
      vertical: true,
    }
    let topButtonGroup
    if (size === 'big') {
      topButtonGroup = (
        <Grid.Column>
          <Button icon="twitter" color="twitter" size="big" compact as="a" target="_blank" href="https://twitter.com/stealthyim" style={{ marginLeft: margin }} />
          <Button icon="medium" compact as="a" size="big" target="_blank" href="https://medium.com/@stealthyim" style={{ marginLeft: '0.5em', backgroundColor: '#66CDAA', color: 'white' }} />
          <Button icon="github" compact as="a" size="big" target="_blank" href="https://github.com/stealthyim" style={{ marginLeft: '0.5em', backgroundColor: '#6e5494', color: 'white' }} />
                  
          <Button size="big" inverted icon positive style={{ marginLeft: '0.5em' }} onClick={this.handleDevSignUpOpen}>
            <Icon name="connectdevelop" />
            &nbsp;Developer Partnerships
          </Button>
          <Button as="a" floated="right" size="big" inverted style={{ marginLeft: '0.5em', marginRight: margin, color: '#34bbed' }} onClick={this.props.handleSignIn}>
            Login with Blockstack
          </Button>
          <Button animated floated="right" as="a" size="big" target="_blank" href="mailto:support@stealthy.im" style={{ marginLeft: '0.5em', backgroundColor: '#34bbed', color: 'white' }}>
            <Button.Content hidden>
              <Icon name='star' />
            </Button.Content>
            <Button.Content visible>
              <Icon name='mail' />
            </Button.Content>
          </Button>
        </Grid.Column>
      )
      menuSettings.fluid = true
    }
    else {
      topButtonGroup = (
        <Grid.Column>
          <Button icon="twitter" color="twitter" size="big" compact as="a" target="_blank" href="https://twitter.com/stealthyim" style={{ marginLeft: margin }} />
          <Button icon="connectdevelop" positive compact as="a" size="big" onClick={this.handleDevSignUpOpen} style={{ marginLeft: '0.5em', }} />
          <Button icon="mail" floated="right" compact as="a" size="big" target="_blank" href="mailto:support@stealthy.im" style={{ marginLeft: '0.5em', marginRight: '0.5em', backgroundColor: '#34bbed', color: 'white' }} />
        </Grid.Column>
      )
      menuSettings.compact = true
      menuSettings.size = 'tiny'
    }
    return (plugin) ? (
      <div>
        <Segment textAlign="center" style={{ minHeight: 700, padding: '1em 0em' }} vertical>
          <Grid centered>
            <Segment textAlign="center" vertical>
              <div style={{ textAlign: 'center', verticalAlign: 'center' }}>
                <Image
                  inline
                  size="tiny"
                  src={chatIcon}
                  style={{ marginBottom: '0.5em', marginTop: '5em' }}
                />
              </div>
              <Header
                as="h1"
                content="Say Hi to Stealthy"
                style={{
                  fontSize: '2.5em',
                  fontWeight: 'bold',
                  marginBottom: '0.5em',
                  marginTop: '1em',
                  marginLeft: '0.5em',
                  marginRight: '0.5em',
                }}
              />
              <Button.Group vertical>
                <Button size="big" compact style={{ marginTop: '1em', marginBottom: '2em', backgroundColor: '#34bbed', color: 'white' }} onClick={this.props.handleCreateAccount}>
                  Create Account
                </Button>
                <Button size="big" style={{ marginTop: '1em', backgroundColor: '#34bbed', color: 'white' }} as='a' href='https://www.stealthy.im' target='_blank'>
                  Login with Blockstack
                </Button>
              </Button.Group>
            </Segment>
          </Grid>
        </Segment>
      </div>
    ) : (
      <div>
        <DeveloperSignUp showSignUp={this.state.showDevSignUp} productType={this.state.productType} product={product} handleSignUpClose={this.handleDevSignUpClose}/>
        <EmailSignUp showSignUp={this.state.showSignUp} productType={this.state.productType} product={product} handleSignUpClose={this.handleSignUpClose}/>
        <Segment textAlign="center" style={{ minHeight: 700, padding: '1em 0em' }} vertical>
          <Grid centered>
            <Grid.Row>
              {topButtonGroup}
            </Grid.Row>
            <Grid stackable>
              <Grid.Column width={8} textAlign="center" verticalAlign="middle">
                <Header
                  as="h1"
                  content="Hi Stealthy!"
                  image={
                    <Image
                      inline
                      size="massive"
                      src={chatIcon}
                    />
                  }
                  style={{
                    fontWeight: 'bold',
                    fontSize: '3em',
                  }}
                />
                <Header
                  as="h2"
                  content="Decentralized Communication Protocol"
                  style={{
                    fontSize: '1.5em',
                    fontWeight: 'normal',
                    marginBottom: '1em',
                    marginTop: '2em',
                    color: 'grey',
                  }}
                />
                <Button.Group vertical>
                  <Button size="big" compact style={{ marginTop: '1em', marginBottom: '2em', backgroundColor: '#34bbed', color: 'white' }} onClick={(product === 'iPhone' || product === 'iPad') ? this.handleSignUpOpenIOS : (product) ? this.handleSignUpOpenAND : this.props.handleCreateAccount}>
                    Create Account
                  </Button>
                  <Button.Group>
                    <Image
                      inline
                      size="small"
                      centered
                      src={appleStore}
                      as="button"
                      onClick={this.handleSignUpOpenIOS}
                    />
                    <Image
                      inline
                      size="small"
                      centered
                      src={googlePlay}
                      as="button"
                      onClick={this.handleSignUpOpenAND}
                    />
                  </Button.Group>
                </Button.Group>
              </Grid.Column>
              <Grid.Column width={2} textAlign='center'/>
              <Grid.Column width={6} textAlign='center'>
                <div style={{zoom: (product) ? "0.6" : "0.8"}} className="marvel-device iphone8plus gold">
                    <div className="top-bar"></div>
                    <div className="sleep"></div>
                    <div className="volume"></div>
                    <div className="camera"></div>
                    <div className="sensor"></div>
                    <div className="speaker"></div>
                    <div className="screen">
                      <YouTube
                        videoId="V9-egxTCFFE"
                        opts={opts}
                      />
                    </div>
                    <div className="home"></div>
                    <div className="bottom-bar"></div>
                </div>
              </Grid.Column>
            </Grid>
          </Grid>
        </Segment>
        <Segment id="diagramsSegment" style={{ padding: '4em 0em', backgroundColor: 'rgba(52,187,237,0.2)' }} vertical>
          <Tab menu={menuSettings} panes={getPanes(size)} />
        </Segment>
        <Segment style={{ paddingBottom: '4em', paddingTop: '6em', backgroundColor: 'rgba(192,192,192,0.2)' }} vertical basic>
          <Container text>
            <Header textAlign="center" as="h3" style={{ fontSize: '2em', paddingBottom: '0.5em' }}>FAQ</Header>
            <FAQ />
          </Container>
        </Segment>
        <div style={{ textAlign: 'center', paddingBottom: '1em', fontSize: '1.25em', backgroundColor: 'rgba(192,192,192,0.2)' }}><b>&copy; 2018 Stealthy Labs</b></div>
      </div>
    );
  }
}
