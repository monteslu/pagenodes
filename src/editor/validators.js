module.exports = function(RED){

RED.validators = {
    number: function(){return function(v) { return v!=='' && !isNaN(v);}},
    regex: function(re){return function(v) { return re.test(v);}}
};

};
