export const geolocateNode = {
  type: 'geolocate',
  category: 'hardware',
  label: (node) => node._node.name || 'geolocation',
  color: 'lightblue', // light blue
  icon: true,
  faChar: '\uf124', // location-arrow
  inputs: 1,
  outputs: 1,

  defaults: {
    mode: { type: 'select', default: 'once', options: [
      { value: 'once', label: 'Single position' },
      { value: 'watch', label: 'Watch position' }
    ]},
    enableHighAccuracy: { type: 'boolean', default: false },
    timeout: { type: 'number', default: 10000 },
    maximumAge: { type: 'number', default: 0 }
  }
};
