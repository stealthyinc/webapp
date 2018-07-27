const utils = require('./../utils.js');
const FirebaseIO = require('./firebaseIO.js');

const INDEX_NAME = 'index.json';
const SHARED_INDEX_NAME = 'sharedIndex.json';

class IndexedIO {
  constructor(logger,
              ioClassInst,
              localUserId,
              localUserPrivateKey,
              localUserPublicKey,
              useEncryption) {
    // TODO: TypeError if ioClassInst is not gaiaIO or firebaseIO.
    this.logger = logger;

    if (ioClassInst) {
      this.ioInst = ioClassInst;
      this.userId = localUserId;
      this.privateKey = localUserPrivateKey;
      this.publicKey = localUserPublicKey;
      this.useEncryption = useEncryption;
      return;
    }

    throw 'ERROR(IndexedIO): ioClassInst is not defined.';
  }

// For testing
  isFirebase() {
    if (this.ioInst) {
      return (this.ioInst instanceof FirebaseIO);
    }
    return false;
  }

// Index File API
// //////////////////////////////////////////////////////////////////////////////

  // Reads a remote index file encrypted for this client's user. Decrypts it
  // and returns the index data.
  //
  readRemoteIndex(remoteUser, dirPath) {
    IndexedIO._checkFilePath(dirPath);

    const indexFilePath = `${dirPath}/${SHARED_INDEX_NAME}`;

    return this.ioInst.readRemoteFile(remoteUser, indexFilePath)
    .then((sharedIndexData) => {
      if (sharedIndexData && this.useEncryption) {
        return utils.decryptToObj(this.privateKey, sharedIndexData);
      }
      return sharedIndexData;
    })
    .catch((err) => {
      this.logger(`ERROR(IndexedIO::readRemoteIndex): ${err}.`);
      return undefined;
    });
  }

  // Reads a local index file encrypted for this client's user. Decrypts it
  // and returns the index data.
  //
  readLocalIndex(dirPath) {
    IndexedIO._checkFilePath(dirPath);

    const indexFilePath = `${dirPath}/${INDEX_NAME}`;

    return this.ioInst.readLocalFile(this.userId, indexFilePath)
    .then((indexData) => {
      if (indexData && this.useEncryption) {
        return utils.decryptToObj(this.privateKey, indexData);
      }
      return indexData;
    })
    .catch((err) => {
      this.logger(`ERROR(IndexedIO::readLocalIndex): ${err}.`);
      return undefined;
    });
  }

  // Writes the index file encrypted for the current user. Optionally,
  // if someonesPubKey is defined, a second file is written, encrypted for the
  // owner of the someonesPubKey.
  //
  writeLocalIndex(dirPath, indexData, someonesPubKey = undefined) {
    IndexedIO._checkFilePath(dirPath);

    const time = Date.now();
    indexData.time = time;

    const indexFilePath = IndexedIO._getIndexPath(dirPath);
    const writeData = (this.useEncryption) ?
      utils.encryptObj(this.publicKey, indexData) : indexData;

    const writePromises = [];
    writePromises.push(
      this.ioInst.writeLocalFile(this.userId, indexFilePath, writeData));

    if (someonesPubKey) {
      writePromises.push(
        this._writeSharedIndex(dirPath, indexData, someonesPubKey));
    }

    return Promise.all(writePromises);
  }

  // Private -- don't call this outside of this class.
  //
  _writeSharedIndex(dirPath, indexData, someonesPubKey) {
    const sharedIndexFilePath = IndexedIO._getSharedIndexPath(dirPath);
    const sharedWriteData = (this.useEncryption) ?
      utils.encryptObj(someonesPubKey, indexData) : indexData;

    return this.ioInst.writeLocalFile(
      this.userId, sharedIndexFilePath, sharedWriteData);
  }


// Indexed/Managed File API
// //////////////////////////////////////////////////////////////////////////////

  // If someonesPubKey is not specified, this method writes the specified data to
  // filePath in this client user's storage using their encryption key.
  // It also updates the index file in filePath to list this file and the
  // time of the write operation.
  //
  // If someonesPubKey is defined, this method writes the specified data to
  // filePath in this client user's storage using someonesPubKey encryption key.
  // It also updates both the index file in filePath, readable by this client's
  // user, and the shared index file in filePath, encrypted to be readable by
  // the someone that owns someonesPubKey.
  //
  writeLocalFile(filePath, data, someonesPubKey = undefined) {
    IndexedIO._checkFilePath(filePath);

    const path = IndexedIO._pathMinusTail(filePath);
    const fileName = this._pathTail(filePath);
    const time = Date.now();

    return this.readLocalIndex(path)
    .then((indexData) => {
      const sanoIndexData = IndexedIO._sanitizeIndexData(indexData);
      if (fileName in sanoIndexData.deleted) {
        delete sanoIndexData.deleted[fileName];
      }
      sanoIndexData.active[fileName] = { time };

      const encKey = (someonesPubKey) || this.publicKey;
      const encData = (this.useEncryption) ? utils.encryptObj(encKey, data) : data;

      return this.writeLocalIndex(path, sanoIndexData, someonesPubKey)
      .then(() => this.ioInst.writeLocalFile(this.userId, filePath, encData))
      .catch((err) => {
        this.logger(`ERROR(IndexedIO::writeLocalFile) writing index: ${err}.`);
        return undefined;
      });
    })
    .catch((err) => {
      this.logger(`ERROR(IndexedIO::writeLocalFile) fetching index: ${err}.`);
      return undefined;
    });
  }

  deleteLocalDir(dirPath, someonesPubKey = undefined) {
    IndexedIO._checkFilePath(dirPath);

    const time = Date.now();

    return this.readLocalIndex(dirPath)
    .then((indexData) => {
      const deleteFilePromises = [];
      const sanoIndexData = IndexedIO._sanitizeIndexData(indexData);
      for (const fileName in sanoIndexData.active) {
        delete sanoIndexData.active[fileName];
        sanoIndexData.deleted[fileName] = { time };
        const filePath = `${dirPath}/${fileName}`;
        deleteFilePromises.push(this.ioInst.deleteLocalFile(this.userId, filePath));
      }

      return Promise.all(deleteFilePromises)
      .then((results) => this.writeLocalIndex(dirPath, sanoIndexData, someonesPubKey))
      .catch((err) => {
        this.logger(`ERROR(IndexedIO::deleteLocalDir) deleting files: ${err}.`);
        return undefined;
      });
    })
    .catch((err) => {
      this.logger(`ERROR(IndexedIO::deleteLocalDir) fetching index: ${err}.`);
      return undefined;
    });
  }

  deleteLocalFiles(dirPath, fileList, someonesPubKey) {
    IndexedIO._checkFilePath(dirPath);

    const time = Date.now();

    return this.readLocalIndex(dirPath)
    .then((indexData) => {
      const deleteFilePromises = [];
      const sanoIndexData = IndexedIO._sanitizeIndexData(indexData);
      for (const fileName in sanoIndexData.active) {
        if (!fileList.includes(fileName)) {
          continue;
        }

        delete sanoIndexData.active[fileName];
        sanoIndexData.deleted[fileName] = { time };
        const filePath = `${dirPath}/${fileName}`;
        deleteFilePromises.push(this.ioInst.deleteLocalFile(this.userId, filePath));
      }

      return Promise.all(deleteFilePromises)
      .then((results) => this.writeLocalIndex(dirPath, sanoIndexData, someonesPubKey))
      .catch((err) => {
        this.logger(`ERROR(IndexedIO::deleteLocalFiles) deleting files: ${err}.`);
        return undefined;
      });
    })
    .catch((err) => {
      this.logger(`ERROR(IndexedIO::deleteLocalFiles) fetching index: ${err}.`);
      return undefined;
    });
  }

  deleteLocalFile(filePath, someonesPubKey = undefined) {
    IndexedIO._checkFilePath(filePath);

    const path = IndexedIO._pathMinusTail(filePath);
    const fileName = this._pathTail(filePath);
    const time = Date.now();

    return this.readLocalIndex(path)
    .then((indexData) => {
      const sanoIndexData = IndexedIO._sanitizeIndexData(indexData);
      if (fileName in sanoIndexData.active) {
        delete sanoIndexData.active[fileName];
      }
      sanoIndexData.deleted[fileName] = { time };

      return this.writeLocalIndex(path, sanoIndexData, someonesPubKey)
      .then(() => this.ioInst.deleteLocalFile(this.userId, filePath))
      .catch((err) => {
        this.logger(`ERROR(IndexedIO::deleteLocalFile) writing index: ${err}.`);
        return undefined;
      });
    })
    .catch((err) => {
      this.logger(`ERROR(IndexedIO::deleteLocalFile) fetching index: ${err}.`);
      return undefined;
    });
  }

  // TODO: handle encryption in these:
  //
  // Public Non-Indexed IO Methods (essentially pass-thru methods):
  //
  readLocalFile(filePath) {
    IndexedIO._checkFilePath(filePath);
    return this.ioInst.readLocalFile(this.userId, filePath)
    .then((data) => {
      if ((data === undefined) || (data === null)) {
        return data;
      }
      if (this.useEncryption) {
        return utils.decryptToObj(this.privateKey, data);
      }
      return data;
    })
    .catch((err) => {
      this.logger(`ERROR(IndexedIO::readLocalFile): ${err}.`);
      return undefined;
    });
  }

  readRemoteFile(remoteUser, filePath) {
    IndexedIO._checkFilePath(filePath);
    return this.ioInst.readRemoteFile(remoteUser, filePath)
    .then((data) => {
      if ((data === undefined) || (data === null)) {
        return data;
      }
      if (utils.isEmptyObj(data)) {
        return undefined;
      }
      if (this.useEncryption) {
        return utils.decryptToObj(this.privateKey, data);
      }
      return data;
    })
    .catch((err) => {
      this.logger(`ERROR(IndexedIO::readRemoteFile): ${err}.`);
      return undefined;
    });
  }

  static _getIndexPath(aDir) {
    return `${aDir}/${INDEX_NAME}`;
  }

  static _getSharedIndexPath(aDir) {
    return `${aDir}/${SHARED_INDEX_NAME}`;
  }

  // The original design of baseIO was working in a single directory, but with
  // IndexedIO we're opening that up to deeper hierarchies. This method checks
  // for well formed file paths that do not exceed our limitations:
  //   - we don't support relative paths
  //   - we don't support dropping directories
  //   - we don't support absolute paths from root
  //
  static _checkFilePath(aFilePath) {
    if (aFilePath.startsWith('/')) {
      throw `ERROR: Unsupported file path specified: ${filePath}. Paths cannot be specified from root.`;
    }

    if (aFilePath.endsWith('/')) {
      throw `ERROR: Unsupported file path specified: ${filePath}. Trailing "/" not supported.`;
    }

    if (aFilePath.includes('..')) {
      throw `ERROR: Unsupported file path specified: ${filePath}. ".." is not supported.`;
    }

    if (aFilePath.includes('./')) {
      throw `ERROR: Unsupported file path specified: ${filePath}. "./" is not supported.`;
    }

    if (aFilePath.includes('~')) {
      throw `ERROR: Unsupported file path specified: ${filePath}. "~" is not supported.`;
    }
  }

  _pathTail(aFilePath) {
    let retValue = IndexedIO.stringCopyForChrome(aFilePath);
    const idx = aFilePath.lastIndexOf('/');
    if (idx !== -1) {
      retValue = aFilePath.substr(idx + 1);
    }
    if (this.ioInst instanceof FirebaseIO) {
      retValue = IndexedIO._cleanPathForFirebase(retValue);
    }
    return retValue;
  }

  static _cleanPathForFirebase(path) {
    return path.replace(/\./g, '_');
  }

  // https://stackoverflow.com/questions/31712808/how-to-force-javascript-to-deep-copy-a-string
  static stringCopyForChrome(aString) {
    return (` ${aString}`).slice(1);
  }

  static _pathMinusTail(aFilePath) {
    const idx = aFilePath.lastIndexOf('/');
    if (idx !== -1) {
      return aFilePath.substr(0, idx);
    }
    return aFilePath;
  }

  static _sanitizeIndexData(theIndexData) {
    if ((theIndexData === undefined) || (theIndexData === null)) {
      theIndexData = {};
    }
    if ((theIndexData.deleted === undefined) || (theIndexData.deleted === null)) {
      theIndexData.deleted = {};
    }
    if ((theIndexData.active === undefined) || (theIndexData.active === null)) {
      theIndexData.active = {};
    }
    if (theIndexData.hasOwnProperty('cipherText')) {
      throw 'ERROR: index data is unexpectedly still encrypted!';
    }
    return theIndexData;
  }
}

module.exports = { IndexedIO };
