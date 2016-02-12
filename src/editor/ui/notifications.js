module.exports = function(RED){

RED.notify = (function() {
    var currentNotifications = [];
    var c = 0;
    return function(msg,type,fixed,timeout) {
        if (currentNotifications.length > 4) {
            var ll = currentNotifications.length;
            for (var i = 0;ll > 4 && i<currentNotifications.length;i+=1) {
                var notifiction = currentNotifications[i];
                if (!notifiction.fixed) {
                    window.clearTimeout(notifiction.timeoutid);
                    notifiction.close();
                    ll -= 1;
                }
            }
        }
        var n = document.createElement("div");
        n.id="red-notification-"+c;
        n.className = "notification";
        n.fixed = fixed;
        if (type) {
            n.className = "notification notification-"+type;
        }
        n.style.display = "none";
        n.innerHTML = msg;
        $("#notifications").append(n);
        $(n).slideDown(300);
        n.close = (function() {
            var nn = n;
            return function() {
                currentNotifications.splice(currentNotifications.indexOf(nn),1);
                $(nn).slideUp(300, function() {
                    nn.parentNode.removeChild(nn);
                });
            };
        })();
        if (!fixed) {
            n.timeoutid = window.setTimeout(n.close,timeout||3000);
        }
        currentNotifications.push(n);
        c+=1;
        return n;
    }
})();

};
