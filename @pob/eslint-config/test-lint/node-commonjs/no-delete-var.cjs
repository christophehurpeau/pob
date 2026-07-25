/* eslint-disable strict, no-var -- sloppy mode + var required to delete a variable */
var x = 1;
// eslint-disable-next-line no-delete-var
delete x;
exports.x = x;
