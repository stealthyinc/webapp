/**
*
* DeleteContactModal
*
*/

import React from 'react';
import PropTypes from 'prop-types';

import Blockies from 'react-blockies';

import {
  Button,
  Header,
  Icon,
  Image,
  Modal,
} from 'semantic-ui-react';

class VideoInviteModal extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    const {
      activeContact,
      showVideoInvite,
      handleVideoOpen,
      handleVideoInviteClose,
    } = this.props;
    const name = (activeContact && activeContact.title) ? activeContact.title : (activeContact && activeContact.id) ? activeContact.id : '';
    const modalContent = `Incoming Video Call or Screen Sharing Invitation:  ${name}`;
    // const modalContent = `Incoming Video Call Request:  ${name}`;
    // const modalContent = `Incoming Screen Sharing Request:  ${name}`;
    const seed = (this.props.author) ? this.props.author : 'garbage';
    const contactImage = (activeContact && activeContact.image) ? (
      <Image wrapped size="small" src={activeContact.image} />
    ) : (
      <Image circular bordered>
        <Blockies seed={seed} size={12} />
      </Image>
    );
    return (
      <div>
        <Modal
          open={showVideoInvite}
          basic size="small"
          name="delete"
        >
          <Header icon="record" content={modalContent} />
          <Modal.Content image>
            {contactImage}
          </Modal.Content>
          <Modal.Actions>
            <Button color="red" inverted onClick={handleVideoInviteClose} >
              <Icon name="remove circle" /> Decline
            </Button>
            <Button color="green" inverted contact={activeContact} onClick={handleVideoOpen}>
              <Icon name="check circle" /> Accept
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

VideoInviteModal.propTypes = {
  activeContact: PropTypes.object,
  showVideoInvite: PropTypes.bool,
  handleVideoOpen: PropTypes.func,
  handleVideoInviteClose: PropTypes.func,
};

export default VideoInviteModal;
