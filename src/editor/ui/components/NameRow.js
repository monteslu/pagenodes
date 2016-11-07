import { Component } from 'react';

export default class NameRow extends Component {
  render() {
    const {config} = this.props;
    const inputId = config ? "node-config-input-name" : "node-input-name";
    return (
      <div className="form-row">
        <label htmlFor="node-input-name"><i className="fa fa-tag"></i> <span data-i18n="common.label.name"></span></label>
        <input type="text" id={inputId} data-i18n="[placeholder]common.label.name"/>
      </div>
    );
  }
}

