module.exports = function(RED) {

  RED.nodes.registerType('localwrite', {
    category: 'storage',
    color: "#7E57C2",
    defaults: {
      name: {
        value: ""
      },
      append: {
        value: '',
      },
      key: {
        value: "",
        required:true
      }
    },
    inputs: 1,
    outputs: 0,
    icon: "leveldb.png",
    label: function() {
      return this.name || "localwrite";
    },
    labelStyle: function() {
      return this.name ? "node_label_italic" : "";
    }
  });


  RED.nodes.registerType('localread', {
    category: 'storage',
    color: "#7E57C2",
    defaults: {
      name: {
        value: ""
      },
      key: {
        value: "",
        required:true
      }
    },
    inputs: 1,
    outputs: 1,
    icon: "leveldb.png",
    label: function() {
      return this.name || "localread";
    },
    labelStyle: function() {
      return this.name ? "node_label_italic" : "";
    }
  });
}
