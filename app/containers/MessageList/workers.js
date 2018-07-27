export function handleResultSelect(e, { result }) {
  this.setState({ value: '' });
  this.props.handleSearchSelect(result);
  this.props.resetContactSearch();
}

export function handleFormSubmit(event) {
  event.preventDefault();
  if (this.props.slowSearch) {
    setTimeout(() => {
      this.props.changeUsername(this.state.value);
      this.props.fetchProfiles();
    }, 500);
  }
}

export function handleSearchChange(e, { value }) {
  this.setState({ value });
  if (value.length < 1) return this.props.resetContactSearch();
  const timeout = (value.length < 3) ? 1000 : 500
  if (!this.props.slowSearch) {
    setTimeout(() => {
      this.props.changeUsername(this.state.value);
      this.props.fetchProfiles();
    }, timeout);
  }
}

export function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export function onDrop(files) {
  if (this.state.status !== 'green') {
    this.setState({ userOfflineError: true });
  } else {
    const pako = require('pako');
    this.props.logger('files uploading', files);
    this.getBase64(files[0]).then(
      (data) => {
        this.props.logger(data);
        this.props.logger(pako.deflate(data));
      }
    );
  }
}
