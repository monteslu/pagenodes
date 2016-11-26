import { Component } from 'react';

export default class TypeTextRow extends Component {
  render() {
    const {icon, label, name, config} = this.props;
    const inputId = config ? "node-config-input-" + name : "node-input-" + name;
    return (
      <div className="form-row" id={"node-div-" + name + "Row"}>
        <label htmlFor={inputId}>
          <i className={"fa fa-" + (icon || "cog")}/>
          <span id={"node-label-" + name}> {label || name}</span>
        </label>
        <input type="text" id={inputId} style={{ width: "70%" }}/>
        <input type="hidden" id={inputId + 'Type'}/>
      </div>
    );
  }
}
