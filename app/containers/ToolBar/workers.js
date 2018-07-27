export function updateDynamicStep() {
  let dynamicStep = {};
  if (this.props.newContactSearch || !this.props.contactMgr.getActiveContact()) {
    dynamicStep = {
      title: 'Search Bar',
      text: 'Search for a blockstack user\'s name or id',
      selector: '.search',
      position: 'bottom',
      style: {
        mainColor: '#f07b50',
        beacon: {
          inner: '#f07b50',
          outer: '#f07b50',
        },
      },
    };
  } else {
    dynamicStep = {
      title: 'Active Contact',
      text: 'Here you can see contact\'s profile, remove them, or video chat',
      selector: '.activeContact',
      position: 'top-right',
      style: {
        mainColor: '#a350f0',
        beacon: {
          inner: '#a350f0',
          outer: '#a350f0',
        },
      },
    };
  }
  this.props.updateSteps(dynamicStep);
  this.toggleVisibility();
  this.props.startTour();
}

export function handleItemClick(e, { name }) {
  if (name === 'settings') {
    this.props.handleSettingsOpen();
    this.toggleVisibility();
  }
}
