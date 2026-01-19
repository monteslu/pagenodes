export const commentNode = {
  type: 'comment',
  category: 'common',
  description: 'Adds a comment to the flow',
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
  },

  // Comment nodes have no runtime behavior

  renderHelp() {
    return (
      <>
        <p>A comment node for documenting your flows. Has no inputs, outputs, or runtime behavior - purely for documentation and organization.</p>

        <h5>Usage</h5>
        <ul>
          <li>Set the <strong>Name</strong> to display a title on the canvas</li>
          <li>Use the <strong>Info</strong> field to write detailed notes in Markdown format</li>
          <li>Place near related nodes to explain what a section of the flow does</li>
        </ul>

        <h5>Tips</h5>
        <ul>
          <li>Document complex logic, API requirements, or business rules</li>
          <li>Note any external dependencies or configuration needed</li>
          <li>Include examples of expected input/output formats</li>
        </ul>
      </>
    );
  }
};
