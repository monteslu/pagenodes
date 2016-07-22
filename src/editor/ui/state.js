module.exports = function(RED){

  RED.state = {
    DEFAULT: 0,
    MOVING: 1,
    JOINING: 2,
    MOVING_ACTIVE: 3,
    ADDING: 4,
    EDITING: 5,
    EXPORT: 6,
    IMPORT: 7,
    IMPORT_DRAGGING: 8
  }

};
