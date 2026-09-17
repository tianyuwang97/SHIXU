const {evaluateFixedWindow}=require('./fixed-window-rules.cjs');
// Old persisted rolling boxes are intentionally ignored.
function evaluateBreakout(row,context){return evaluateFixedWindow(row,context,'up');}
module.exports={evaluateBreakout};
