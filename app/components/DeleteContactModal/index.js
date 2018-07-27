/**
*
* DeleteContactModal
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

class DeleteContactModal extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    const {
      showDelete,
      deleteContact,
      activeContact,
      handleDeleteClose,
    } = this.props;
    const name = (activeContact && activeContact.title) ? activeContact.title : (activeContact && activeContact.id) ? activeContact.id : '';
    const modalContent = `Delete Contact: ${name}`;
    return (
      <div>
        <Modal
          open={showDelete}
          basic size="small"
          name="delete"
        >
          <Header icon="archive" content={modalContent} />
          <Modal.Content>
            Your message history will be deleted, would you like to continue?
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" inverted onClick={handleDeleteClose} >
              <Icon name="remove" /> No
            </Button>
            <Button color="red" inverted contact={activeContact} onClick={deleteContact}>
              <Icon name="checkmark" /> Yes
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

DeleteContactModal.propTypes = {
  showDelete: PropTypes.bool,
  handleClose: PropTypes.func,
  deleteContact: PropTypes.func,
  activeContact: PropTypes.object,
};

export default DeleteContactModal;
