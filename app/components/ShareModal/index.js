/**
*
* ShareModal
*
*/

import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Header,
  Icon,
  Modal,
} from 'semantic-ui-react';

class ShareModal extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    const {
      activeId,
      userId,
      showShare,
      handleShareClose,
    } = this.props;
    const description = (activeId && activeId.title) ? activeId.title : (activeId && activeId.id) ? (activeId.id) : '';
    const shareLink = `https://www.stealthy.im/?add=${userId.substring(0, userId.indexOf('.id'))}`;
    const modalContent = 'Share Conversation Link';
    return (
      <div>
        <Modal
          open={showShare}
          size="small"
          basic
        >
          <Header icon="share" content={modalContent} />
          <Modal.Content>
            <Header inverted>Send {description} this conversation: &nbsp;&nbsp;<a href={shareLink}>{shareLink}</a></Header>
            <Icon name="discussions" />
            <Icon />
            <Icon name="envelope" />
            <Icon />
            <Icon name="slack" />
            <Icon />
            <Icon name="facebook" />
            <Icon />
            <Icon name="twitter" />
            <Icon />
            <Icon name="google plus" />
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" inverted onClick={handleShareClose} >
              <Icon name="checkmark" /> Done
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

ShareModal.propTypes = {
  showShare: PropTypes.bool,
  handleShareClose: PropTypes.func,
};

export default ShareModal;
