/**
*
* Message
*
*/

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Feed, Icon, Image, Popup } from 'semantic-ui-react';
import Blockies from 'react-blockies';

const { MESSAGE_STATE } = require('./../../messaging/chatMessage.js');

const SendWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SmsgWrapper = styled.div`
  background-color: #37B9FF;
  border-radius: 10px;
  clear: both;
  color: #fff;
  cursor: default;
  float: right;
  font-size: 16px;
  margin: 10px 10px 0 0;
  max-width: 452px;
  padding: 5px 10px;
`;

const ReceWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
`;

class Message extends React.PureComponent {
  static propTypes = {
    author: PropTypes.string,
    body: PropTypes.string.isRequired,
    userId: PropTypes.string,
  }
  render() {
    let bgColor = '#F2F2F2';

    if (this.props.author !== this.props.userId) {
      const lightColorArr = [
        'Lavender',
        'LightBlue',
        'Thistle',
        'AntiqueWhite',
        'PowderBlue',
        'RosyBrown',
        'Aqua',
        'LightCyan',
        'Pink',
        'Tan',
        'Aquamarine',
        'BurlyWood',
        'DarkSeaGreen',
        'DeepSkyBlue',
        'Gold',
        'GoldenRod',
        'GreenYellow',
        'HotPink',
        'Khaki',
        'Yellow',
        'Coral',
        'Cyan',
        'DarkKhaki',
        'DarkOrange',
        'DarkSalmon',
      ]

      // Hack for relay message coloring:
      const msgTxt = this.props.body;
      const relayedTxtArr = msgTxt.match(/.+?.id says:/i);
      if (relayedTxtArr && relayedTxtArr.length > 0) {
        const relayedUserId = relayedTxtArr[0].replace(' says:', '');

        // const idx = Math.floor(Math.random() * relayedUserId.length);
        const idx = (relayedUserId.length > 3) ? 2 : 0;
        let ascii = relayedUserId.charCodeAt(idx);
        if (ascii < 32) {
          ascii = 32;
        } else if (ascii > 126) {
          ascii = 126;
        }
        ascii = ascii - 32;
        const percAsciiMax = ascii / (126 - 32);

        // let sum = 0;
        // for (let idx = 0; idx < relayedUserId.length; idx++) {
        //   sum += relayedUserId.charCodeAt(idx);
        // }
        // const denom = (relayedUserId.length > 1) ? (relayedUserId.length - 1) : 1;
        // const avg = sum / denom;
        // const percAsciiMax = avg / 255;

        const colorIndex = (relayedUserId === 'pbj.id') ?  14 :
          Math.floor(percAsciiMax * lightColorArr.length);
        bgColor = lightColorArr[colorIndex]
      }
    }

    const RmsgWrapper = styled.div`
      background-color: ${bgColor};
      border-radius: 10px;
      clear: both;
      color: #000;
      float: left;
      margin-left: 20px;
      cursor: default;
      font-size: 16px;
      margin: 10px 10px 0 0;
      max-width: 452px;
      padding: 5px 10px;
    `;



    const Position = (this.props.author !== this.props.userId) ? ReceWrapper : SendWrapper;
    const OppPosition = (this.props.author === this.props.userId) ? ReceWrapper : SendWrapper;
    const MessageDiv = (this.props.author !== this.props.userId) ? RmsgWrapper : SmsgWrapper;
    const TopMsgDivStyle = (this.props.author !== this.props.userId) ? {} : { paddingRight: '10px' };
    const time = new Date(this.props.time).toLocaleTimeString('en-US');
    const color = (this.props.author !== this.props.userId) ? 'black' : 'white';
    let Status = (this.props.showIndex === this.props.index) ? (
      <Icon size="large" name="circle notched" loading color="grey" />
    ) : null;
    let msg = 'Sending...';
    if (this.props.state === MESSAGE_STATE.SEEN) {
      const contactImage = (this.props.activeContact && this.props.activeContact.image) ? (
        <Icon size="large"><Image circular src={this.props.activeContact.image} /></Icon>
      ) : (
        <Image circular bordered>
          <Blockies seed={this.props.author} size={6} />
        </Image>
      );
      Status = (this.props.showIndex === this.props.index) ? <Icon>{contactImage}</Icon> : null;
      msg = 'Seen';
    } else if (this.props.state === MESSAGE_STATE.RECEIVED) {
      Status = (this.props.showIndex === this.props.index) ? <Icon size="large" name="check circle outline" color="green" /> : null;
      msg = 'Received';
    // } else if (this.props.delivered) {
    } else if (this.props.state === MESSAGE_STATE.SENT_REALTIME) {
      Status = (this.props.showIndex === this.props.index) ? <Icon size="large" name="check circle outline" color="teal" /> : null;
      msg = 'Sent Online';
    // } else if (this.props.offline) {
    } else if (this.props.state === MESSAGE_STATE.SENT_OFFLINE) {
      Status = (this.props.showIndex === this.props.index) ? <Icon size="large" name="check circle outline" color="grey" /> : null;
      msg = 'Sent Offline';
    }
    const popStatus = (this.props.author === this.props.userId) ? (
      <Popup.Header>{msg}</Popup.Header>
    ) : null;
    const chStatus = (this.props.author === this.props.userId) ? Status : null;
    return (
      <div style={TopMsgDivStyle}>
        <Position>
          <Feed>
            <Feed.Event>
              <Popup
                position="bottom center" trigger={<Feed.Content>
                  <MessageDiv>
                    <Feed.Extra text style={{ color, margin: 0 }}>{this.props.body}</Feed.Extra>
                  </MessageDiv>
                  <Feed.Extra style={{ verticalAlign: 'top', textAlign: 'right' }}>
                    {chStatus}
                  </Feed.Extra>
                </Feed.Content>}
              >
                {popStatus}<Feed.Date style={{ justifyContent: 'flex-end' }}>{time}</Feed.Date>
              </Popup>
            </Feed.Event>
          </Feed>
        </Position>
      </div>
    );
  }
}

export default Message;
