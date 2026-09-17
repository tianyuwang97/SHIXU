const {evaluateFixedWindow}=require('./fixed-window-rules.cjs');
function evaluateBreakdown(row,context){return evaluateFixedWindow(row,context,'down');}
module.exports={evaluateBreakdown};
