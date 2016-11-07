import { Component } from 'react';

export default class TextRow extends Component {
  render() {
    const {icon, label, name, config, options} = this.props;
    const inputId = config ? "node-config-input-" + name : "node-input-" + name;

    const rows = options.map(function(option){
      if(typeof option === 'string'){
        return (<option value={option}>{option}</option>);
      }
      return (<option value={option[1]}>{option[0]}</option>);
    });


    return (
      <div className="form-row" id={"node-div-" + name + "Row"}>
        <label htmlFor="node-input-method">
          <i className={"fa fa-" + (icon || "cog")}/>
          <span> {label || name}</span>
        </label>
        <select type="text" id={inputId}>
          {rows}
        </select>
      </div>

    );
  }
}











