/**
*
* SettingsModal
*
*/

import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Image,
  List,
  Modal,
  Radio,
} from 'semantic-ui-react';

class SettingsModal extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    const {
      open,
      close,
      handleRadio,
      buildDate,
      buildTime,
      buildVersion,
      logger,
      sConsole,
      search,
      discovery,
      webrtc,
    } = this.props;
    const version = `${buildVersion.major}.${buildVersion.minor}.${buildVersion.patch}`;
    return (
      <div>
        <Modal size="large" dimmer="blurring" open={open}>
          <Modal.Header>My Settings</Modal.Header>
          <Modal.Content>
            <Modal.Description>
              <List relaxed>
                <List.Item>
                  <List.Content>
                    <Radio
                      toggle
                      onChange={handleRadio}
                      checked={sConsole}
                      name="console"
                      label="Console Messages: User can see processes running under the hood for debugging"
                    />
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <Radio
                      toggle
                      onChange={handleRadio}
                      checked={search}
                      name="search"
                      label="Passive Search: For slower internet connections user search results are shown after submit"
                    />
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <Radio
                      toggle
                      onChange={handleRadio}
                      checked={discovery}
                      name="discovery"
                      label="Centralized Discovery: Enable firebase to show contacts that have added you automatically"
                    />
                  </List.Content>
                </List.Item>
                <List.Item>
                  <List.Content>
                    <Radio
                      toggle
                      onChange={handleRadio}
                      checked={webrtc}
                      name="webrtc"
                      label="Enable WebRTC: online connections for video, screen sharing, file transfers, and messaging"
                    />
                  </List.Content>
                </List.Item>
              </List>
            </Modal.Description>
          </Modal.Content>
          <Modal.Content>
            <Modal.Description style={{ fontFamily: 'Courier New' }}>
              <a><b>Build Information: {version} - {buildDate}</b></a>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button inverted color="red" onClick={close}>
              Close
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

SettingsModal.propTypes = {
  open: PropTypes.bool,
  close: PropTypes.func,
};

export default SettingsModal;
