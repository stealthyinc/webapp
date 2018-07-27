/**
*
* AddContactModal
*
*/

import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Header,
  Icon,
  Image,
  Modal,
} from 'semantic-ui-react';


class AddContactModal extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    const {
      showAdd,
      addContact,
      addContactInfo,
      handleAddClose,
    } = this.props;
    const name = (addContactInfo && addContactInfo.title) ? addContactInfo.title : (addContactInfo && addContactInfo.id) ? addContactInfo.id : '';
    const image = (addContactInfo && addContactInfo.image) ? <Image wrapped size="small" src={addContactInfo.image} floated="right" /> : null;
    const modalContent = `Would you like to add contact: ${name}?`;
    return (
      <div>
        <Modal
          open={showAdd}
          size="tiny"
          name="add"
          basic
        >
          <Header icon="add user" content={modalContent} />
          <Modal.Content image>
            {image}
          </Modal.Content>
          <Modal.Actions>
            <Button color="red" inverted onClick={handleAddClose} >
              <Icon name="remove" /> No
            </Button>
            <Button color="green" inverted contact={addContactInfo} onClick={addContact}>
              <Icon name="checkmark" /> Yes
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

AddContactModal.propTypes = {
  showAdd: PropTypes.bool,
  handleClose: PropTypes.func,
  addContact: PropTypes.func,
};

export default AddContactModal;
