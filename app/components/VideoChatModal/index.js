/**
*
* VideoChatModal
*
*/

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import {
  Button,
  Image,
  Modal,
} from 'semantic-ui-react';

import Brand from '../../images/stealthy_plane.svg';

const ImgWrapper = styled.div`
  position: absolute;
  bottom: 0;
  z-index: 1;
  width: 60px;
  padding-left: 5px;
  padding-bottom: 5px;
`;

const FullButtonWrapper = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 1;
  width: 60px;
  padding-left: 5px;
  padding-bottom: 12px;
`;

const CloseButtonWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  width: 60px;
  padding-left: 5px;
  padding-top: 12px;
`;

const Video = styled.video`
  height: 100%;
  width: 100%;
`;

import poster from '../../images/videoPoster.png';

class VideoChatModal extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.state = {
      fullIcon: false,
      fullSize: false,
    }
  }
  handleScreenSize = () => {
    this.setState({ fullIcon: !this.state.fullIcon, fullSize: !this.state.fullSize });
  }
  render() {
    const { open, close } = this.props;
    const { fullIcon, fullSize } = this.state;

    const icon = (fullIcon) ? "compress" : "expand";
    const size = (fullSize) ? "fullscreen" : "large";

    return (
      <div id='videoChatModalDiv'>
        <Modal size={size} dimmer="blurring" open={open}>
          <CloseButtonWrapper>
            <Button icon="close" color="red" onClick={close} />
          </CloseButtonWrapper>
          <Video poster={poster}/>
          <ImgWrapper><Image src={Brand} /></ImgWrapper>
          <FullButtonWrapper>
            <Button
              icon={icon}
              color="green"
              onClick={this.handleScreenSize}
            />
          </FullButtonWrapper>
        </Modal>
      </div>
    );
  }
}

VideoChatModal.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.func,
};

export default VideoChatModal;
