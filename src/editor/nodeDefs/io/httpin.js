module.exports = function (RED) {
  RED.nodes.registerType('http request', {
    category: 'function',
    color: "rgb(231, 231, 174)",
    defaults: {
      name: {
        value: ""
      },
      method: {
        value: "GET"
      },
      ret: {
        value: "txt"
      },
      url: {
        value: ""
      },
      //user -> credentials
      //pass -> credentials
    },
    // credentials: {
    //     user: {type:"text"},
    //     password: {type: "password"}
    // },
    inputs: 1,
    outputs: 1,
    //icon: "white-globe.png",
    faChar: '&#xf0ac;', //globe
    label: function () {
      return this.name || this._("httpin.httpreq");
    },
    labelStyle: function () {
      return this.name ? "node_label_italic" : "";
    },
    oneditprepare: function () {
      // if (this.credentials.user || this.credentials.has_password) {
      //     $('#node-input-useAuth').prop('checked', true);
      //     $(".node-input-useAuth-row").show();
      // } else {
      //     $('#node-input-useAuth').prop('checked', false);
      //     $(".node-input-useAuth-row").hide();
      // }

      $("#node-input-useAuth").change(function () {
        if ($(this).is(":checked")) {
          $(".node-input-useAuth-row").show();
        } else {
          $(".node-input-useAuth-row").hide();
          $('#node-input-user').val('');
          $('#node-input-password').val('');
        }
      });

      $("#node-input-ret").change(function () {
        if ($("#node-input-ret").val() === "obj") {
          $("#tip-json").show();
        } else {
          $("#tip-json").hide();
        }
      });
    },
    render: function () {
      return (
        <div>
          <div className="form-row">
            <label htmlFor="node-input-method">
              <i className="fa fa-tasks" />
              <span data-i18n="httpin.label.method" />
            </label>
            <select
              type="text"
              id="node-input-method"
              style={{width: '72%'}}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="use" data-i18n="httpin.setby" />
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="node-input-url">
              <i className="fa fa-globe" />
              <span data-i18n="httpin.label.url" />
            </label>
            <input
              type="text"
              id="node-input-url"
              placeholder="http://" />
          </div>
          <div className="form-row">
            <label htmlFor="node-input-name">
              <i className="fa fa-tag" />
              <span data-i18n="common.label.name" />
            </label>
            <input
              type="text"
              id="node-input-name"
              data-i18n="[placeholder]common.label.name" />
          </div>
          <div className="form-tips" id="tip-json" hidden>
            <span data-i18n="httpin.tip.req" />
          </div>
        </div>
      )
    },
    renderHelp: function () {
      return (
<div>
  <p>
    Provides a node for making http requests.
  </p>
  <p>
    <i>*All addresses must be https:// and have CORS enabled</i>
  </p>
  <p>The URL and HTTP method can be configured in the node, if they are left blank they should be set in an incoming message on <code>msg.url</code> and <code>msg.method</code>:</p>
  <ul>
    <li>
      <code>url</code>
      , if set, is used as the url of the request. Must start with http: or https:
    </li>
    <li>
      <code>method</code>
      , if set, is used as the HTTP method of the request.
      Must be one of <code>GET</code>, <code>PUT</code>, <code>POST</code>, <code>PATCH</code> or <code>DELETE</code> (default: GET)
    </li>
    <li>
      <code>headers</code>
      , if set, should be an object containing field/value
      pairs to be added as request headers
    </li>
    <li>
      <code>payload</code> is sent as the body of the request
      </li>
    </ul>
    <p>
      When configured within the node, the URL property can contain <a href="http://mustache.github.io/mustache.5.html" target="_new">mustache-style</a> tags. These allow the
      url to be constructed using values of the incoming message. For example, if the url is set to
      <code>example.com/</code>, it will have the value of <code>msg.topic</code> automatically inserted.
        Using  prevents mustache from escaping characters like / &amp; etc.
      </p>
      <p>
        The output message contains the following properties:
      </p>
      <ul>
        <li>
          <code>payload</code> is the body of the response
          </li>
          <li>
            <code>statusCode</code> is the status code of the response, or the error code if the request could not be completed
            </li>
            <li>
              <code>headers</code> is an object containing the response headers
              </li>
            </ul>
            <p>
              <b>Note</b>
              : If you need to configure a proxy please add <b>http_proxy=...</b> to your environment variables and restart Node-RED.
            </p>
          </div>
      )
    },
    renderDescription: () => <p>Makes http requests to CORS enabled servers</p>
  });
};
