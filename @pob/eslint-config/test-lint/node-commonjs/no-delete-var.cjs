/* eslint-disable strict -- sloppy mode + var required to delete a variable */
/* oxlint-disable no-var -- sloppy mode + var required to delete a variable */
var x = 1;
// oxlint-disable-next-line no-delete-var
delete x;
exports.x = x;
