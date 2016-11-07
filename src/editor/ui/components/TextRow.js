import { Component } from 'react';

export default class TextRow extends Component {
  render() {
    const {icon, label, placeholder, name, config} = this.props;
    const inputId = config ? "node-config-input-" + name : "node-input-" + name;
    return (
      <div className="form-row" id={"node-div-" + name + "Row"}>
        <label htmlFor={inputId}>
          <i className={"fa fa-" + (icon || "cog")}/>
          <span> {label || name}</span>
        </label>
        <input type="text" id={inputId} placeholder={placeholder}/>
      </div>
    );
  }
}

