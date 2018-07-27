export const statusIndicators = {
  available: 'green',
  busy: 'red',
  inactive: 'yellow',
  offline: 'grey',
};

export const getJoyRideSteps = function () {
  let jrSteps = [];

  jrSteps.push(
    {
      title: 'Add a contact',
      text: 'Add blockstack users to communicate with',
      selector: '.addContact',
      position: 'top',
      isFixed: true,
      type: 'hover',
    });

  jrSteps.push(
    {
      title: 'Search Bar',
      text: 'Search for a blockstack user\'s name or id',
      selector: '.search',
      isFixed: true,
      position: 'bottom',
      style: {
        mainColor: '#f07b50',
        beacon: {
          inner: '#f07b50',
          outer: '#f07b50',
        },
      },
    });

  jrSteps.push(
    {
      title: 'Message History',
      text: 'This is the messages you have exchanged with your contacts',
      selector: '.messageHistory',
      style: {
        mainColor: '#ff67b4',
        beacon: {
          inner: '#ff67b4',
          outer: '#ff67b4',
        },
      },
    });

  jrSteps.push(
    {
      title: 'Message Input',
      text: 'Type a message or drag and drop attachments to send',
      selector: '.messageInput',
      isFixed: true,
      position: 'top',
      style: {
        mainColor: '#12d217',
        beacon: {
          inner: '#12d217',
          outer: '#12d217',
        },
      },
    });

  jrSteps.push(
    {
      title: 'Toolbar',
      text: 'Here are your options (logout, settings, mail, profile...)',
      selector: '.toolbar',
      isFixed: true,
      position: 'top',
      style: {
        mainColor: '#cccc00',
        beacon: {
          inner: '#cccc00',
          outer: '#cccc00',
        },
      },
    });

  return jrSteps;
}

export const testContactArr = [
  {
    id: 'poochkin.id',
    title: 'Vladimir Poochkin',
    summary: 'World Domination!',
    unread: 0,
    time: '2 mins ago',
    status: statusIndicators.offline,
    publicKey: '0321f3753d7f1bde82672bbcca9363bc9f9f074ffdb5ec4741f76da47df97f90a8',
  },
  {
    id: 'batzdorff.id',
    title: 'Batzdorff Carreira',
    summary: 'Ruff!',
    unread: 0,
    time: '2 mins ago',
    status: statusIndicators.offline,
    publicKey: '0321f3753d7f1bde82672bbcca9363bc9f9f074ffdb5ec4741f76da47df97f90a8',
  },
  {
    id: 'piehead.id',
    title: 'Pie-Head Carreira',
    summary: 'Food?',
    unread: 0,
    time: '7 mins ago',
    status: statusIndicators.offline,
    publicKey: '0321f3753d7f1bde82672bbcca9363bc9f9f074ffdb5ec4741f76da47df97f90a8',
  },
];
