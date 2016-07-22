module.exports = function(RED){

  RED.popover = (function() {


    function createPopover(options) {
      var target = options.target;

      var content = options.content;
      var delay = options.delay;
      var timer = null;
      var active;
      var div;

      var openPopup = function() {
        if (active) {
          div = $('<div class="red-ui-popover"></div>').html(content).appendTo("body");
          var targetPos = target.offset();
          var targetWidth = target.width();
          var targetHeight = target.height();

          var divHeight = div.height();
          div.css({top: targetPos.top+targetHeight/2-divHeight/2-10,left:targetPos.left+targetWidth+17});

          div.fadeIn("fast");
        }
      }
      var closePopup = function() {
        if (!active) {
          if (div) {
            div.fadeOut("fast",function() {
              $(this).remove();
            });
            div = null;
          }
        }
      }

      target.on('mouseenter',function(e) {
        clearTimeout(timer);
        active = true;
        timer = setTimeout(openPopup,delay.show);
      });
      target.on('mouseleave', function(e) {
        if (timer) {
          clearTimeout(timer);
        }
        active = false;
        setTimeout(closePopup,delay.hide);
      });
      var res = {
        setContent: function(_content) {
          content = _content;
        }
      }
      target.data('popover',res);
      return res;

    }

    return {
      create: createPopover
    }

  })();

};

