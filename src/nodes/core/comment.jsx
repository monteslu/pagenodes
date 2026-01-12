export const commentNode = {
  type: 'comment',
  category: 'common',
  label: (node) => node._node.name || '',
  color: '#ffffff',
  icon: true,
  faChar: '\uf075', // comment
  inputs: 0,
  outputs: 0,

  defaults: {
    info: {
      type: 'code',
      default: '',
      language: 'markdown',
      placeholder: 'Add documentation here...'
    }
  }

  // Comment nodes have no runtime behavior
};
