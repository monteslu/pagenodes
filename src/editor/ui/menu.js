//This whole file is configured in /src/editor/main.js
module.exports = function(RED){

RED.menu = (function() {

    var menuItems = {};

    function createMenuItem(opt) {
        var item;

        if (opt !== null && opt.id) {
            var themeSetting = RED.settings.theme("menu."+opt.id);
            if (themeSetting === false) {
                return null;
            }
        }

        function setInitialState() {
            var savedStateActive = isSavedStateActive(opt.id);
            if (savedStateActive) {
                link.addClass("active");
                opt.onselect.call(opt, true);
            } else if (savedStateActive === false) {
                link.removeClass("active");
                opt.onselect.call(opt, false);
            } else if (opt.hasOwnProperty("selected")) {
                if (opt.selected) {
                    link.addClass("active");
                } else {
                    link.removeClass("active");
                }
                opt.onselect.call(opt, opt.selected);
            }
        }
        // 1. BASE FUNCTIONALITY
        // Create an initial state that determines whether or not you are logged in or not
        // Creates a button based off of logged in status to take them to auth0 login.
        // If they are logged in it will give them an option to log out.

        // 2. EXPAND FUNCTIONALITY
        // If they are logged in console.log a connection to the database.
        // Set up database to show their username as "Welcome Username"

        if (opt === null) {
            item = $('<li class="divider"></li>');
        } else {
            item = $('<li></li>');

            if (opt.group) {
                item.addClass("menu-group-"+opt.group);

            }
            var linkContent = '<a '+(opt.id?'id="'+opt.id+'" ':'')+'tabindex="-1" href="#">';
            if (opt.toggle) {
                linkContent += '<i class="fa fa-square pull-left"></i>';
                //Display Node Status
                linkContent += '<i class="fa fa-check-square pull-left"></i>';

            }
            if (opt.icon !== undefined) {
                if (/\.png/.test(opt.icon)) {
                    linkContent += '<img src="'+opt.icon+'"/> ';
                } else {
                    linkContent += '<i class="'+(opt.icon?opt.icon:'" style="display: inline-block;"')+'"></i> ';
                }
            }

            if (opt.sublabel) {
                linkContent += '<span class="menu-label-container"><span class="menu-label">'+opt.label+'</span>'+
                               '<span class="menu-sublabel">'+opt.sublabel+'</span></span>'
            } else {
                linkContent += '<span class="menu-label">'+opt.label+'</span>'
            }

            linkContent += '</a>';

            var link = $(linkContent).appendTo(item);

            menuItems[opt.id] = opt;

            if (opt.onselect) {
                link.click(function() {
                    if ($(this).parent().hasClass("disabled")) {
                        return;
                    }
                    if (opt.toggle) {
                        var selected = isSelected(opt.id);
                        if (typeof opt.toggle === "string") {
                            if (!selected) {
                                for (var m in menuItems) {
                                    if (menuItems.hasOwnProperty(m)) {
                                        var mi = menuItems[m];
                                        if (mi.id != opt.id && opt.toggle == mi.toggle) {
                                            setSelected(mi.id,false);
                                        }
                                    }
                                }
                                setSelected(opt.id,true);
                            }
                        } else {
                            setSelected(opt.id, !selected);
                        }
                    } else {
                        opt.onselect.call(opt);
                    }
                });
                setInitialState();
            } else if (opt.href) {
                link.attr("target","_blank").attr("href",opt.href);
            } else if (!opt.options) {
                item.addClass("disabled");
                link.click(function(event) {
                    event.preventDefault();
                });
            }
            if (opt.options) {
                item.addClass("dropdown-submenu pull-left");
                var submenu = $('<ul id="'+opt.id+'-submenu" class="dropdown-menu"></ul>').appendTo(item);

                for (var i=0;i<opt.options.length;i++) {
                    var li = createMenuItem(opt.options[i]);
                    if (li) {
                        li.appendTo(submenu);
                    }
                }
            }
            if (opt.disabled) {
                item.addClass("disabled");
            }
        }


        return item;

    }
    function createMenu(options) {

        var button = $("#"+options.id);

        //button.click(function(event) {
        //    $("#"+options.id+"-submenu").show();
        //    event.preventDefault();
        //});


        var topMenu = $("<ul/>",{id:options.id+"-submenu", class:"dropdown-menu pull-right"}).insertAfter(button);

        var lastAddedSeparator = false;
        for (var i=0;i<options.options.length;i++) {
            var opt = options.options[i];
            if (opt !== null || !lastAddedSeparator) {
                var li = createMenuItem(opt);
                if (li) {
                    li.appendTo(topMenu);
                    lastAddedSeparator = (opt === null);
                }
            }
        }
    }

    function isSavedStateActive(id) {
        return RED.settings.get("menu-" + id);
    }

    function isSelected(id) {
        return $("#" + id).hasClass("active");
    }

    function setSavedState(id, state) {
        RED.settings.set("menu-" + id, state);
    }

    function setSelected(id,state) {
        if (isSelected(id) == state) {
            return;
        }
        var opt = menuItems[id];
        if (state) {
            $("#"+id).addClass("active");
        } else {
            $("#"+id).removeClass("active");
        }
        if (opt && opt.onselect) {
            opt.onselect.call(opt,state);
        }
        setSavedState(id, state);
    }

    function setDisabled(id,state) {
        if (state) {
            $("#"+id).parent().addClass("disabled");
        } else {
            $("#"+id).parent().removeClass("disabled");
        }
    }

    function addItem(id,opt) {
        var item = createMenuItem(opt);
        if (opt.group) {
            var groupItems = $("#"+id+"-submenu").children(".menu-group-"+opt.group);
            if (groupItems.length === 0) {
                item.appendTo("#"+id+"-submenu");
            } else {
                for (var i=0;i<groupItems.length;i++) {
                    var groupItem = groupItems[i];
                    var label = $(groupItem).find(".menu-label").html();
                    if (opt.label < label) {
                        $(groupItem).before(item);
                        break;
                    }
                }
                if (i === groupItems.length) {
                    item.appendTo("#"+id+"-submenu");
                }
            }
        } else {
            item.appendTo("#"+id+"-submenu");
        }
    }
    function removeItem(id) {
        $("#"+id).parent().remove();
    }

    function setAction(id,action) {
        var opt = menuItems[id];
        if (opt) {
            opt.onselect = action;
            $("#"+id).click(function() {
                if ($(this).parent().hasClass("disabled")) {
                    return;
                }
                if (menuItems[id].toggle) {
                    setSelected(id,!isSelected(id));
                } else {
                    menuItems[id].onselect.call(menuItems[id]);
                }
            });
        }
    }

    return {
        init: createMenu,
        setSelected: setSelected,
        isSelected: isSelected,
        setDisabled: setDisabled,
        addItem: addItem,
        removeItem: removeItem,
        setAction: setAction
        //TODO: add an api for replacing a submenu - see library.js:loadFlowLibrary
    }
})();

};
