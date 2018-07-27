/**
*
* TransactionModal
*
*/

import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Modal,
} from 'semantic-ui-react';

class TransactionModal extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    const {
      userId,
      avatarUrl,
      contact,
      walletInfo,
      showTransaction,
      handleTransactionClose,
    } = this.props;
    const sendImage = (avatarUrl) ? (
      <Image circular size="tiny" bordered src={avatarUrl} />
    )
     : (
       <Image circular>
         <Blockies seed={userId} size={20} />
       </Image>
    );
    let contactImage = null;
    if (contact) {
      contactImage = (contact.image) ? (
        <Image circular size="tiny" bordered src={contact.image} />
      )
       : (
         <Image circular>
           <Blockies seed={contact.id} size={20} />
         </Image>
      );
    }
    const modalContent = 'Bitcoin Transaction';
    return (
      <div>
        <Modal
          open={showTransaction}
          size="fullscreen"
        >
          <Header icon="bitcoin" content={modalContent} />
          <Grid stackable textAlign="center" verticalAlign="middle">
            <Grid.Column textAlign="center" verticalAlign="middle" width={1} />
            <Grid.Column textAlign="center" verticalAlign="middle" width={5}>
              {sendImage}
              <Header as="h4" icon="qrcode" content={walletInfo.myWallet} />
            </Grid.Column>
            <Grid.Column width={4}>
              <Input action={{ icon: 'bitcoin' }} placeholder="1.00" size="large" />
            </Grid.Column>
            <Grid.Column textAlign="center" verticalAlign="middle" width={6}>
              {contactImage}
              <Header as="h4" icon="qrcode" content={walletInfo.contactWallet} />
            </Grid.Column>
          </Grid>
          <Modal.Actions>
            <Button color="red" inverted onClick={handleTransactionClose}>
              <Icon name="remove" /> Cancel
            </Button>
            <Button color="green" inverted onClick={handleTransactionClose} >
              <Icon name="checkmark" /> Send
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

TransactionModal.propTypes = {
  showTransaction: PropTypes.bool,
  handleTransactionClose: PropTypes.func,
};

export default TransactionModal;
