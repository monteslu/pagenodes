export const notifyNode = {
  type: 'notify',
  category: 'output',
  label: (node) => node._node.name || 'notify',
  color: '#b7a990', // light tan/brown
  icon: true,
  faChar: '\uf0f3', // bell
  inputs: 1,
  outputs: 0,

  defaults: {
    title: { type: 'string', default: 'PageNodes' }
  },

  mainThread: {
    show(peerRef, nodeId, { title, body }) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  }
};
