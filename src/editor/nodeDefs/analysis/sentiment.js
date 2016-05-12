module.exports = function(RED){
  RED.nodes.registerType('sentiment',{
    category: 'analysis-function',
    color:"#E6E0F8",
    defaults: {
      name: {value:""},
    },
    inputs:1,
    outputs:1,
    faChar: "&#xf11a;", //meh-o
    label: function() {
      return this.name||"sentiment";
    },
    labelStyle: function() {
      return this.name?"node_label_italic":"";
    },
    render: function () {
      return (
        <div>
        <div className="form-row">
        <label htmlFor="node-input-name"><i className="fa fa-tag"></i> <span data-i18n="common.label.name"></span></label>
          <input type="text" id="node-input-name" data-i18n="[placeholder]common.label.name"/>
        </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
        <div>
        <p>Analyses the <b>msg.payload</b> and adds a <b>msg.sentiment</b> object that contains the resulting AFINN-111 sentiment score as <b>msg.sentiment.score</b>.</p>
        <p>A score greater than zero is positive and less than zero is negative.</p>
        <p>The score typically ranges from -5 to +5, but can go higher and lower.</p>
        <p>An object of word score overrides can be supplied as <b>msg.overrides</b>.</p>
        <p>See <a href="https://github.com/thisandagain/sentiment/blob/master/README.md" target="_new">the Sentiment docs here</a>.</p>

        </div>
      )
    },
    renderDescription: () => <p>Returns a numerical value based off of sentiment analysis</p>
  });
};
