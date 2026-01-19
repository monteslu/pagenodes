// relatedDocs for notify node
const notifyRelatedDocs = [
  { label: 'Notifications API (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API' },
  { label: 'Notification Constructor (MDN)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification' },
  { label: 'Notifications Spec (WHATWG)', url: 'https://notifications.spec.whatwg.org/' }
];

export const notifyNode = {
  type: 'notify',
  category: 'output',
  description: 'Shows browser notifications',
  requiresGesture: true,
  label: (node) => node._node.name || node.tag || 'notify',
  color: '#b7a990', // light tan/brown
  icon: true,
  faChar: '\uf0f3', // bell
  inputs: 1,
  outputs: 0,

  defaults: {
    title: { type: 'string', default: 'PageNodes', label: 'Title' },
    tag: { type: 'string', default: '', label: 'Tag', placeholder: 'Group/replace notifications with same tag' },
    requireInteraction: { type: 'boolean', default: false, label: 'Require interaction', description: 'Keep notification visible until user clicks or dismisses it' },
    silent: { type: 'boolean', default: false, label: 'Silent', description: 'Suppress notification sounds and vibrations' }
  },

  messageInterface: {
    reads: {
      payload: {
        type: 'string',
        description: 'Notification body text',
        required: true
      },
      title: {
        type: 'string',
        description: 'Override the configured title',
        optional: true
      },
      icon: {
        type: 'string',
        description: 'Override icon URL',
        optional: true
      },
      image: {
        type: 'string',
        description: 'Large image URL to display in notification',
        optional: true
      },
      tag: {
        type: 'string',
        description: 'Override tag (replaces notification with same tag)',
        optional: true
      },
      data: {
        type: 'any',
        description: 'Arbitrary data attached to notification',
        optional: true
      }
    }
  },

  mainThread: {
    show(peerRef, nodeId, options) {
      const { title, body, icon, image, tag, requireInteraction, silent, renotify, data } = options;

      const notificationOptions = {
        body,
        icon: icon || '/favicon.ico',
        tag: tag || undefined,
        requireInteraction: requireInteraction || false,
        silent: silent || false,
        renotify: tag ? (renotify || false) : undefined,
        image: image || undefined,
        data: data || undefined
      };

      // Remove undefined values
      Object.keys(notificationOptions).forEach(key => {
        if (notificationOptions[key] === undefined) {
          delete notificationOptions[key];
        }
      });

      if (Notification.permission === 'granted') {
        new Notification(title, notificationOptions);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, notificationOptions);
          }
        });
      }
    }
  },

  renderHelp() {
    return (
      <>
        <p>Shows a browser notification with full Notifications API support.</p>

        <h5>Options</h5>
        <ul>
          <li><strong>Title</strong> - Notification title (default: "PageNodes")</li>
          <li><strong>Tag</strong> - Group notifications; new ones with same tag replace old ones</li>
          <li><strong>Require interaction</strong> - Notification stays visible until user clicks or dismisses it (won't auto-hide)</li>
          <li><strong>Silent</strong> - No sounds or vibrations when notification appears</li>
        </ul>

        <h5>Input</h5>
        <ul>
          <li><code>msg.payload</code> - Notification body text</li>
          <li><code>msg.title</code> - Override title</li>
          <li><code>msg.icon</code> - Override icon URL</li>
          <li><code>msg.image</code> - Large image URL (shown in notification body)</li>
          <li><code>msg.tag</code> - Override tag</li>
          <li><code>msg.data</code> - Arbitrary data to attach</li>
        </ul>

        <h5>Tags</h5>
        <p>Use tags to group related notifications. A new notification with the same tag replaces the previous one instead of stacking.</p>

        <h5>Permissions</h5>
        <p>Browser notifications require user permission. The first time a notification is triggered, the browser will prompt the user.</p>

        <h5>Note</h5>
        <p>Requires user gesture to activate. Some options like <code>image</code> may not be supported on all platforms.</p>
      </>
    );
  },

  relatedDocs: () => notifyRelatedDocs
};
