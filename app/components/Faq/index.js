/**
*
* Faq
*
*/

import React, { Component } from 'react';
import { Accordion, Icon } from 'semantic-ui-react';

export default class Faq extends Component {
  state = { activeIndex: 0 }

  handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;

    this.setState({ activeIndex: newIndex });
  }

  render() {
    const { activeIndex } = this.state;

    return (
      <Accordion fluid style={{ padding: '0em 4em 0em' }}>
        <Accordion.Title active={activeIndex === 0} index={0} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>What is Stealthy?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 0}>
          <p>
            Stealthy is a decentralized, end to end encrypted, p2p chat and video application built with security & privacy in mind.
          </p>
        </Accordion.Content>
        <Accordion.Title active={activeIndex === 9} index={9} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>How much does it cost?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 9}>
          <p>
            Stealthy for personal use is free and includes basic features. For more advanced features, we are planning to introduce a fee structure.
          </p>
          <p>
            If you're an enterprise or any other entity interested in using Stealthy, please <a href={`${'mailto:support@stealthy.im?subject=Enterprise%20Plans%20Pricing'}`}>contact us</a> to discuss pricing and options.
          </p>
        </Accordion.Content>
        <Accordion.Title active={activeIndex === 1} index={1} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>Why does decentralization matter?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 1}>
          <p>
           Centralization can be a good thing. It helps computers process things faster, for example. But that's changing.
           Centralization often means companies and governments gaining access to your data without you knowing or approving.
          </p>
          <p>
           Decentralization makes that impossible and <b>Stealthy</b> does not store any information.
          </p>
          <p>
            <a href="https://blockstack.org/faq/#what_is_a_decentralized_internet?" target="_blank">What is a decentralized internet?</a>
          </p>
        </Accordion.Content>
        <Accordion.Title active={activeIndex === 2} index={2} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>Why is Stealthy built on Blockstack?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 2}>
          <p>
            Blockstack has many advantages over other platforms for building decentralized applications.
            The primary advantage is that Blockstack is the first to enable sharing of data while maintaining decentralization.
          </p>
          <p>
            Until now, decentralized apps were restricted to a single user maintaining decentralized data with no option to share.
          </p>
          <p>
            <a href="https://blockstack.org/faq/#what_problems_does_blockstack_solve?" target="_blank">What problems does Blockstack solve?</a>
          </p>
        </Accordion.Content>
        <Accordion.Title active={activeIndex === 3} index={3} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>What if Blockstack goes away?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 3}>
          <p>
            Blockstack is an open source project, so even if the company goes away, the underlying technology still exists and will continue to operate.
          </p>
          <p>
            <a href="https://github.com/blockstack" target="_blank">Blockstack Github</a>
          </p>
        </Accordion.Content>
        <Accordion.Title active={activeIndex === 4} index={4} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>What do I need to do to get started?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 4}>
          <p>
            Just click the login button. If you have not previously installed the Blockstack browser, you'll be prompted to do so. That's it. Run the Blockstack browser in the background and sign into Stealthy.
          </p>
        </Accordion.Content>
        <Accordion.Title active={activeIndex === 5} index={5} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>Where is my data actually being stored?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 5}>
          <p>
            This depends on your choices. By default, your data is stored in a dedicated Microsoft Azure Blob. But you can and should connect your Blockstack Browser to your own cloud storage solutions (preferably multiple).
          </p>
        </Accordion.Content>
        <Accordion.Title active={activeIndex === 6} index={6} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>Isn't that centralized?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 6}>
          <p>
            Azure is a centralized service, but by encrypting your data, and because your private key is never exposed, Azure cannot access your data. With data replication, there is no single-point of failure and no entity has access to the content of your files.
          </p>
          <p>
            <a href="https://blockstack.org/intro" target="_blank">How Blockstack Works</a>
          </p>
        </Accordion.Content>
        <Accordion.Title active={activeIndex === 7} index={7} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>How is my data secured?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 7}>
          <p>
            Every file and every message is encrypted using ECIES with SHA256. It can only be decrypted by your private key. When you write a message, that message is encrypted and can only be decrypted by the specific receiving user's private key.
          </p>
        </Accordion.Content>
        <Accordion.Title active={activeIndex === 8} index={8} onClick={this.handleClick}>
          <Icon name="dropdown" />
          <b>Can I delete my data?</b>
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 8}>
          <p>
            Yes, you can manually delete any and all of your data. Stealthy uses your preferred cloud service to store your information and does not have access to it.
          </p>
        </Accordion.Content>
      </Accordion>
    );
  }
}
